
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const nav = $("#mainNav");
  const menuToggle = $("#menuToggle");
  const modal = $("#infoModal");
  const modalTitle = $("#modalTitle");
  const modalBody = $("#modalBody");
  const modalAction = $("#modalAction");
  const toast = $("#toast");

  const origin = $("#origin");
  const destination = $("#destination");
  const travelDate = $("#travelDate");
  const returnDate = $("#returnDate");
  const people = $("#people");
  const searchForm = $("#searchForm");
  const searchResults = $("#searchResults");
  const searchHint = $("#searchHint");

  const labels = {
    plane: "هواپیما",
    train: "قطار",
    bus: "اتوبوس",
    stay: "اقامتگاه"
  };

  let currentType = "plane";
  let toastTimer;
  let lastModalAction = null;
  let favorites = loadFavorites();

  function localDate(date = new Date()) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function loadFavorites() {
    try {
      const value = JSON.parse(localStorage.getItem("safarino_favorites") || "[]");
      return Array.isArray(value) ? value.filter(v => typeof v === "string") : [];
    } catch {
      return [];
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem("safarino_favorites", JSON.stringify(favorites));
    } catch {
      showToast("مرورگر اجازه ذخیره علاقه‌مندی‌ها رو نداد.");
    }
    updateFavorites();
  }

  function updateFavorites() {
    $(".favorite-count").textContent = String(favorites.length)
      .replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);

    $$("[data-favorite]").forEach(button => {
      const active = favorites.includes(button.dataset.favorite);
      button.classList.toggle("is-favorite", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function showToast(message, type = "info") {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = "toast show";

    if (type === "error") toast.classList.add("error");
    if (type === "success") toast.classList.add("success");

    toastTimer = setTimeout(() => {
      toast.className = "toast";
    }, 3500);
  }

  function openModal(title, html, actionText = "متوجه شدم", action = null) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modalAction.textContent = actionText;
    lastModalAction = action;

    if (typeof modal.showModal === "function") {
      if (!modal.open) modal.showModal();
    } else {
      showToast(title + " — " + modalBody.textContent);
    }
  }

  function closeModal() {
    if (modal.open) modal.close();
  }

  $("#modalClose").addEventListener("click", closeModal);
  modalAction.addEventListener("click", () => {
    const action = lastModalAction;
    closeModal();
    if (typeof action === "function") action();
  });

  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });

  function closeMenu() {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "باز کردن منو");
    menuToggle.innerHTML = '<svg><use href="#i-menu"></use></svg>';
  }

  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "بستن منو" : "باز کردن منو");
    menuToggle.innerHTML = open
      ? '<svg><use href="#i-close"></use></svg>'
      : '<svg><use href="#i-menu"></use></svg>';
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });

  const today = localDate();
  travelDate.min = today;
  returnDate.min = today;

  travelDate.addEventListener("change", () => {
    returnDate.min = travelDate.value || today;

    if (returnDate.value && returnDate.value < travelDate.value) {
      returnDate.value = "";
      showToast("تاریخ برگشت رو دوباره انتخاب کن.", "error");
    }
  });

  returnDate.addEventListener("change", () => {
    if (returnDate.value && travelDate.value &&
        returnDate.value < travelDate.value) {
      returnDate.value = "";
      showToast("تاریخ برگشت نمی‌تونه قبل از حرکت باشه.", "error");
    }
  });

  function setType(type) {
    if (!Object.hasOwn(labels, type)) return;

    currentType = type;
    const stay = type === "stay";

    $$(".booking-tab").forEach(tab => {
      const active = tab.dataset.type === type;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    $("#originWrap").hidden = stay;
    $("#destinationWrap").hidden = stay;
    $("#returnWrap").hidden = stay;

    origin.required = !stay;
    destination.required = !stay;
    travelDate.required = true;

    $("#dateCaption").textContent = stay ? "تاریخ ورود" : "تاریخ حرکت";
    $("#peopleCaption").textContent = stay ? "تعداد مهمانان" : "تعداد مسافران";
    searchHint.innerHTML =
      '<span class="hint-dot"></span> ' +
      (stay
        ? "مقصد و تاریخ اقامتت رو مشخص کن."
        : "اطلاعات سفرت رو وارد کن و مقصدت رو پیدا کن.");

    searchResults.hidden = true;
  }

  $$(".booking-tab").forEach(tab => {
    tab.addEventListener("click", () => setType(tab.dataset.type));
  });

  $$(".main-nav [href^='#']").forEach(link => {
    link.addEventListener("click", () => {
      closeMenu();
      if (link.dataset.type) setType(link.dataset.type);
    });
  });

  $$(".service-item[data-type]").forEach(button => {
    button.addEventListener("click", () => {
      setType(button.dataset.type);
      $("#booking").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  $("#swapButton").addEventListener("click", () => {
    if (currentType === "stay") {
      showToast("برای جست‌وجوی اقامتگاه نیازی به جابه‌جایی نیست.");
      return;
    }

    const previous = origin.value;
    origin.value = destination.value;
    destination.value = previous;
    showToast("مبدأ و مقصد جابه‌جا شدند.", "success");
  });

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function renderResults(details) {
    const from = escapeHTML(details.from);
    const to = escapeHTML(details.to);
    const date = escapeHTML(details.date);
    const count = escapeHTML(details.people);
    const type = escapeHTML(labels[details.type]);

    const examples = [
      { name: "گزینه اقتصادی", detail: "برای برنامه‌ریزی با بودجه مناسب", tag: "اقتصادی" },
      { name: "گزینه پیشنهادی", detail: "برای بررسی و مقایسه انتخاب‌ها", tag: "پیشنهادی" },
      { name: "گزینه منعطف", detail: "برای بررسی انتخاب‌های دیگر", tag: "انعطاف‌پذیر" }
    ];

    const direction = details.type === "stay"
      ? `اقامت در ${to}`
      : `${from} ← ${to}`;

    searchResults.innerHTML = `
      <div class="results-heading">
        <div>
          <h3>نتایج نمایشی جست‌وجو</h3>
          <p>${direction} · ${date} · ${count} نفر · ${type}</p>
        </div>
        <button type="button" class="results-close" id="closeResults">بستن ×</button>
      </div>
      <p class="result-disclaimer">
        این گزینه‌ها نمونه هستند؛ قیمت، ظرفیت و موجودی واقعی از سرویس رزرو دریافت نشده است.
      </p>
      ${examples.map((item, index) => `
        <div class="sample-result">
          <div>
            <strong>${item.name}</strong>
            <small>${item.detail}</small>
            <span class="sample-tag">${item.tag}</span>
          </div>
          <button type="button" data-example="${index}">جزئیات</button>
        </div>
      `).join("")}
    `;

    searchResults.hidden = false;
    $("#closeResults").addEventListener("click", () => {
      searchResults.hidden = true;
    });

    $$("[data-example]", searchResults).forEach(button => {
      button.addEventListener("click", () => {
        openModal(
          examples[Number(button.dataset.example)].name,
          `<p>این یک نتیجه نمونه برای ${type} است.</p>
           <div class="modal-list">
             <div>مسیر: ${direction}</div>
             <div>تاریخ: ${date}</div>
             <div>تعداد افراد: ${count}</div>
             <div>قیمت و ظرفیت واقعی هنوز متصل نیست.</div>
           </div>`,
          "متوجه شدم"
        );
      });
    });

    searchResults.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  searchForm.addEventListener("submit", event => {
    event.preventDefault();

    if (!travelDate.value) {
      showToast("لطفاً تاریخ سفر رو انتخاب کن.", "error");
      travelDate.focus();
      return;
    }

    if (travelDate.value < today) {
      showToast("تاریخ انتخاب‌شده گذشته است.", "error");
      travelDate.focus();
      return;
    }

    if (returnDate.value && returnDate.value < travelDate.value) {
      showToast("تاریخ برگشت باید بعد از تاریخ حرکت باشه.", "error");
      returnDate.focus();
      return;
    }

    const stay = currentType === "stay";
    const from = origin.value.trim();
    const to = destination.value.trim();

    if (!stay && !from) {
      showToast("لطفاً شهر مبدأ رو وارد کن.", "error");
      origin.focus();
      return;
    }

    if (!stay && !to) {
      showToast("لطفاً شهر مقصد رو وارد کن.", "error");
      destination.focus();
      return;
    }

    if (!stay && from.localeCompare(to, "fa", { sensitivity: "base" }) === 0) {
      showToast("مبدأ و مقصد نمی‌تونن یکسان باشن.", "error");
      destination.focus();
      return;
    }

    renderResults({
      type: currentType,
      from: stay ? "—" : from,
      to: stay ? (to || "مقصد انتخابی") : to,
      date: travelDate.value,
      people: people.value
    });
  });

  // انتخاب مقصد از کارت‌ها
  $$(".destination-explore").forEach(button => {
    button.addEventListener("click", () => {
      const city = button.dataset.city;
      setType("plane");
      destination.value = city;
      $("#booking").scrollIntoView({ behavior: "smooth", block: "start" });
      showToast(`مقصد ${city} انتخاب شد. تاریخ و مبدأ رو هم مشخص کن.`, "success");
      setTimeout(() => origin.focus({ preventScroll: true }), 500);
    });
  });

  // افزودن و حذف علاقه‌مندی‌ها
  $$("[data-favorite]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.favorite;

      if (favorites.includes(id)) {
        favorites = favorites.filter(item => item !== id);
        showToast("از علاقه‌مندی‌ها حذف شد.");
      } else {
        favorites.push(id);
        showToast("به علاقه‌مندی‌ها اضافه شد.", "success");
      }

      saveFavorites();
    });
  });

  $("#favoritesButton").addEventListener("click", () => {
    const names = {
      shirāz: "شیراز",
      rasht: "رشت",
      kish: "کیش",
      tabriz: "تبریز",
      nature: "طبیعت‌گردی"
    };

    if (!favorites.length) {
      openModal(
        "علاقه‌مندی‌های تو",
        "<p>هنوز مقصدی ذخیره نکردی. روی قلب کارت مقصدها بزن تا اینجا نمایش داده بشن.</p>",
        "دیدن مقصدها",
        () => $("#destinations").scrollIntoView({ behavior: "smooth" })
      );
      return;
    }

    const list = favorites.map(id =>
      `<div><span>♡</span><span>${escapeHTML(names[id] || id)}</span></div>`
    ).join("");

    openModal(
      "علاقه‌مندی‌های تو",
      `<p>مقصدهایی که ذخیره کردی:</p><div class="modal-list">${list}</div>`,
      "دیدن مقصدها",
      () => $("#destinations").scrollIntoView({ behavior: "smooth" })
    );
  });

  $("#showAllDestinations").addEventListener("click", () => {
    showToast("همه مقصدهای فعلی در همین بخش نمایش داده شده‌اند.");
    $("#destinations").scrollIntoView({ behavior: "smooth" });
  });

  // حساب کاربری نمایشی
  $("#accountButton").addEventListener("click", () => {
    openModal(
      "حساب کاربری سفرینو",
      `<p>این نسخه هنوز به سامانه ثبت‌نام و پایگاه داده متصل نیست.</p>
       <div class="modal-list">
         <div><span>✓</span><span>طراحی فرم ورود و ثبت‌نام در مرحله بعد قابل اضافه‌شدن است.</span></div>
         <div><span>✓</span><span>در این نسخه پیامک یا ایمیل تأیید ارسال نمی‌شود.</span></div>
         <div><span>!</span><span>اطلاعات حساب واقعی وارد نکن؛ این پنجره فقط نمایشی است.</span></div>
       </div>`,
      "متوجه شدم"
    );
  });

  // خبرنامه نمایشی
  $("#newsletterForm").addEventListener("submit", event => {
    event.preventDefault();
    const input = $("#newsletterEmail");
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }

    showToast("درخواست عضویت نمایشی ثبت شد؛ خبرنامه هنوز به سرویس ارسال متصل نیست.", "success");
    input.value = "";
  });

  // راهنما و ارتباط
  $("#footerHelp").addEventListener("click", () => {
    openModal(
      "راهنمای سفرینو",
      `<div class="modal-list">
        <div><span>۱.</span><span>نوع سفر رو انتخاب کن.</span></div>
        <div><span>۲.</span><span>مبدأ، مقصد و تاریخ رو وارد کن.</span></div>
        <div><span>۳.</span><span>نتایج نمونه رو بررسی کن.</span></div>
        <div><span>۴.</span><span>قیمت و رزرو واقعی در این نسخه فعال نیست.</span></div>
      </div>`,
      "شروع جست‌وجو",
      () => $("#booking").scrollIntoView({ behavior: "smooth" })
    );
  });

  $("#contactButton").addEventListener("click", () => {
    openModal(
      "ارتباط با سفرینو",
      "<p>این سایت هنوز سامانه پشتیبانی یا اطلاعات تماس واقعی ندارد. این پنجره برای نسخه نمایشی است.</p>",
      "رفتن به بالای صفحه",
      () => $("#top").scrollIntoView({ behavior: "smooth" })
    );
  });

  // لینک‌های نمایشی شبکه اجتماعی به ابتدای سایت برگردند
  $$(".social-links a").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      showToast("لینک شبکه اجتماعی هنوز تنظیم نشده است.");
    });
  });

  // شروع سایت
  setType("plane");
  updateFavorites();
});