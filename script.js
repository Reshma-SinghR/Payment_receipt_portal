// client-side flow + localStorage persistence

const CREDENTIALS = { username: "admin", password: "password123" };

// LOGIN
function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value;
  if (u === CREDENTIALS.username && p === CREDENTIALS.password) {
    localStorage.setItem("receipt_user", u);
    // redirect to form
    window.location.href = "form.html";
    return false;
  }
  alert("Invalid credentials (demo: admin / password123)");
  return false;
}

// if on form page: attach handlers
document.addEventListener("DOMContentLoaded", function () {
  // if on a page that has logoutBtn
  const logoutBtn =
    document.getElementById("logoutBtn") ||
    document.getElementById("logoutBtn2");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("receipt_user");
      // keep data but force go to login
      window.location.href = "login.html";
    });
  }

  // protect pages: if not logged in redirect to login.html except login page
  const path = location.pathname.split("/").pop();
  if (path !== "login.html") {
    const user = localStorage.getItem("receipt_user");
    if (!user) {
      window.location.href = "login.html";
      return;
    }
  }

  // FORM page: populate if data exists
  if (document.getElementById("receiptForm")) {
    const fields = [
      "receipt_no",
      "date",
      "student_name",
      "admin_no",
      "class_div",
      "tuition_fee",
      "bus_fee",
      "cca_fee",
      "notes",
    ];
    const saved = JSON.parse(localStorage.getItem("receipt_data") || "{}");
    fields.forEach((f) => {
      const el = document.getElementById(f);
      if (el && saved[f] !== undefined) el.value = saved[f];
      // set date default to today if empty
      if (f === "date" && (!el.value || el.value === "")) {
        const d = new Date();
        el.value = d.toISOString().slice(0, 10);
      }
    });

    document
      .getElementById("btnPreview")
      .addEventListener("click", function () {
        // gather values
        const data = {};
        fields.forEach((f) => {
          const el = document.getElementById(f);
          data[f] = el ? el.value : "";
        });

        // auto-generate receipt number if empty
        if (!data["receipt_no"]) {
          data["receipt_no"] = "R-" + Date.now().toString().slice(-6);
        }

        // ensure numeric values
        ["tuition_fee", "bus_fee", "cca_fee"].forEach((k) => {
          data[k] = parseFloat(data[k] || 0).toFixed(2);
        });

        // compute total
        data["total"] = (
          parseFloat(data["tuition_fee"]) +
          parseFloat(data["bus_fee"]) +
          parseFloat(data["cca_fee"])
        ).toFixed(2);

        localStorage.setItem("receipt_data", JSON.stringify(data));
        // go to preview
        window.location.href = "preview.html";
      });

    document.getElementById("btnClear").addEventListener("click", function () {
      if (confirm("Clear form?")) {
        localStorage.removeItem("receipt_data");
        document.getElementById("receiptForm").reset();
      }
    });
  }

  // PREVIEW page: populate preview fields, attach buttons
  if (document.getElementById("p_receipt_no")) {
    const data = JSON.parse(localStorage.getItem("receipt_data") || "{}");
    if (!data || Object.keys(data).length === 0) {
      alert("No receipt data found. Redirecting to form.");
      window.location.href = "form.html";
      return;
    }
    // fill preview fields
    document.getElementById("p_receipt_no").textContent = data.receipt_no || "";
    document.getElementById("p_date").textContent = data.date || "";
    document.getElementById("p_name").textContent = data.student_name || "";
    document.getElementById("p_admin_no").textContent = data.admin_no || "";
    document.getElementById("p_class_div").textContent = data.class_div || "";
    document.getElementById("p_tuition").textContent =
      data.tuition_fee || "0.00";
    document.getElementById("p_bus").textContent = data.bus_fee || "0.00";
    document.getElementById("p_cca").textContent = data.cca_fee || "0.00";
    document.getElementById("p_total").textContent = data.total || "0.00";
    document.getElementById("p_words").textContent = toWords(
      data.total || "0.00"
    );

    // actions
    const btnEdit = document.getElementById("btnEdit");
    const btnPrintPage = document.getElementById("btnPrintPage");
    const btnSaveLocal = document.getElementById("btnSaveLocal");

    if (btnEdit)
      btnEdit.addEventListener("click", function () {
        window.location.href = "form.html";
      });
    if (btnPrintPage)
      btnPrintPage.addEventListener("click", function () {
        window.location.href = "print.html";
      });
    if (btnSaveLocal)
      btnSaveLocal.addEventListener("click", function () {
        // simple local save already in localStorage - just notify
        alert(
          "Receipt saved in browser localStorage. You can re-open form to edit later."
        );
      });
  }

  // PRINT page: populate print fields
  if (document.getElementById("pr_receipt_no")) {
    populatePrintFromStorage();
  }
});

// helper: populate print page from storage
function populatePrintFromStorage() {
  const data = JSON.parse(localStorage.getItem("receipt_data") || "{}");
  if (!data || Object.keys(data).length === 0) {
    alert("No receipt data found. Redirecting to form.");
    window.location.href = "form.html";
    return;
  }
  // preview -> print mapping
  const map = {
    pr_receipt_no: "receipt_no",
    pr_date: "date",
    pr_name: "student_name",
    pr_admin_no: "admin_no",
    pr_class_div: "class_div",
    pr_tuition: "tuition_fee",
    pr_bus: "bus_fee",
    pr_cca: "cca_fee",
    pr_total: "total",
    pr_words: "total",
  };
  Object.keys(map).forEach((k) => {
    const v = data[map[k]] || "";
    const el = document.getElementById(k);
    if (el) el.textContent = k === "pr_words" ? toWords(v) : v;
  });

  // also sync preview page fields if present (useful if user opened print directly)
  [
    "p_receipt_no",
    "p_date",
    "p_name",
    "p_admin_no",
    "p_class_div",
    "p_tuition",
    "p_bus",
    "p_cca",
    "p_total",
    "p_words",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const key = id.replace(/^p_/, "").replace("words", "total");
    if (id === "p_words") el.textContent = toWords(data.total || "0.00");
    else {
      const mapKey =
        {
          receipt_no: "receipt_no",
          date: "date",
          name: "student_name",
          admin_no: "admin_no",
          class_div: "class_div",
          tuition: "tuition_fee",
          bus: "bus_fee",
          cca: "cca_fee",
          total: "total",
        }[key] || key;
      el.textContent = data[mapKey] || "";
    }
  });
}

// simple number-to-words (supports up to crores/lakhs if needed). For demo use a limited converter.
function toWords(amountStr) {
  // convert like "123.00" -> "One Hundred Twenty Three Rupees Only"
  const n = parseFloat(amountStr || "0");
  if (isNaN(n)) return "(in words)";
  const intPart = Math.floor(n);
  if (intPart === 0) return "Zero Rupees Only";
  // very small converter using Intl (for currency spelling we create rough text)
  try {
    // Use built-in toLocaleString for grouping and then map digits to words is complex;
    // We'll use a simple library-free approach for small numbers
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    function inWords(num) {
      if (num < 20) return ones[num];
      if (num < 100)
        return (
          tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "")
        );
      if (num < 1000)
        return (
          inWords(Math.floor(num / 100)) +
          " Hundred" +
          (num % 100 ? " " + inWords(num % 100) : "")
        );
      if (num < 100000)
        return (
          inWords(Math.floor(num / 1000)) +
          " Thousand" +
          (num % 1000 ? " " + inWords(num % 1000) : "")
        );
      if (num < 10000000)
        return (
          inWords(Math.floor(num / 100000)) +
          " Lakh" +
          (num % 100000 ? " " + inWords(num % 100000) : "")
        );
      return (
        inWords(Math.floor(num / 10000000)) +
        " Crore" +
        (num % 10000000 ? " " + inWords(num % 10000000) : "")
      );
    }
    return inWords(intPart) + " Rupees Only";
  } catch (e) {
    return "(in words)";
  }
}
