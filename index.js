document.querySelectorAll(".hero-slider").forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll(".slide"));
    const dots = Array.from(slider.querySelectorAll(".dot"));
    const prev = slider.querySelector(".prev");
    const next = slider.querySelector(".next");
    let activeIndex = 0;
    let timerId;

    if (!slides.length) return;

    const showSlide = (index) => {
        activeIndex = (index + slides.length) % slides.length;

        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle("is-active", slideIndex === activeIndex);
        });

        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle("is-active", dotIndex === activeIndex);
        });
    };

    const restartTimer = () => {
        window.clearInterval(timerId);
        timerId = window.setInterval(() => showSlide(activeIndex + 1), 7000);
    };

    prev?.addEventListener("click", () => {
        showSlide(activeIndex - 1);
        restartTimer();
    });

    next?.addEventListener("click", () => {
        showSlide(activeIndex + 1);
        restartTimer();
    });

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            showSlide(index);
            restartTimer();
        });
    });

    restartTimer();
});

document.querySelectorAll(".documentation-carousel").forEach((carousel) => {
    const viewport = carousel.querySelector(".documentation-viewport");
    const track = carousel.querySelector(".documentation-track");
    const cards = Array.from(carousel.querySelectorAll(".documentation-card"));
    const prev = carousel.querySelector(".carousel-prev");
    const next = carousel.querySelector(".carousel-next");
    let pageIndex = 0;

    if (!viewport || !track || !cards.length || !prev || !next) return;

    const getVisibleCards = () => {
        const value = window.getComputedStyle(carousel).getPropertyValue("--visible-cards");
        return Math.max(1, Number.parseInt(value, 10) || 1);
    };

    const updateCarousel = () => {
        carousel.querySelectorAll("video").forEach((video) => video.pause());
        const visibleCards = getVisibleCards();
        const maxPage = Math.max(0, Math.ceil(cards.length / visibleCards) - 1);
        pageIndex = Math.min(pageIndex, maxPage);
        const targetIndex = Math.min(pageIndex * visibleCards, cards.length - 1);
        const maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
        const offset = Math.min(cards[targetIndex].offsetLeft, maxOffset);
        track.style.transform = `translateX(-${offset}px)`;
        prev.disabled = pageIndex === 0;
        next.disabled = pageIndex === maxPage;
    };

    prev.addEventListener("click", () => {
        pageIndex = Math.max(0, pageIndex - 1);
        updateCarousel();
    });

    next.addEventListener("click", () => {
        const visibleCards = getVisibleCards();
        const maxPage = Math.max(0, Math.ceil(cards.length / visibleCards) - 1);
        pageIndex = Math.min(maxPage, pageIndex + 1);
        updateCarousel();
    });

    window.addEventListener("resize", updateCarousel);
    updateCarousel();
});
