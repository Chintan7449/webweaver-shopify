class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    if (!cartLink) return;

    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add('animate', 'active');
    });

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');
        const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') &&
      this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);

      if (!sectionElement) return;
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);

document.addEventListener("change", async (event) => {
  console.log(
    event.target.classList.contains("cart-drawer__variant-selector"),
    5566
  );

  if (event.target.classList.contains("cart-drawer__variant-selector")) {
    const selector = event.target;
    const line = selector.dataset.line; // This is the 1-based line number in the cart
    const newVariantId = selector.value; // The new variant ID selected from the dropdown

    console.log(selector, 123);
    console.log(line, 456);
    console.log(newVariantId, 789);

    try {
      const removeResponse = await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: line, // Use the old variant ID to remove it
          quantity: 0,
        }),
      });

      const removedCartData = await removeResponse.json();

      // 2. Add the new variant to the cart with the desired quantity
      const addResponse = await fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json", // Crucial for receiving JSON response
        },
        body: JSON.stringify({
          id: newVariantId, // The ID of the new variant selected
          quantity: 1, // Use the original quantity for the new variant
        }),
      });

      const addedCartData = await addResponse.json();

      console.log("Cart updated:", addedCartData);

      // 3. Re-render cart drawer and bubble using Shopify section rendering
      const sectionsResponse = await fetch("/?sections=cart-drawer");
      const sections = await sectionsResponse.json();

      // Update CartDrawer
      const newCartDrawerHtml = new DOMParser()
        .parseFromString(sections["cart-drawer"], "text/html")
        .querySelector("#CartDrawer").innerHTML;
      document.querySelector("#CartDrawer").innerHTML = newCartDrawerHtml;

      // Update Cart Icon Bubble
      // const newCartIconBubbleHtml = new DOMParser().parseFromString(sections["#cart-icon-bubble"], "text/html")
      //   .querySelector("#cart-icon-bubble").innerHTML;
      // document.querySelector("#cart-icon-bubble").innerHTML = newCartIconBubbleHtml;
    } catch (err) {
      console.log("Variant update failed:", err);
    }
  } else {
    const selector = event.target;
    const line = selector.dataset.line; // This is the 1-based line number in the cart
    const newVariantId = selector.value; // The new variant ID selected from the dropdown

    console.log(selector, 111);
    console.log(line, 222);
    console.log(newVariantId, 333);
    try {
      const removeResponse = await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json", // Crucial for receiving JSON response
        },
        body: JSON.stringify({
          id: line, // Use the old variant ID to remove it
          quantity: 0,
        }),
      });

      const removedCartData = await removeResponse.json();

      // 2. Add the new variant to the cart with the desired quantity
      const addResponse = await fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json", // Crucial for receiving JSON response
        },
        body: JSON.stringify({
          id: newVariantId, // The ID of the new variant selected
          quantity: 1, // Use the original quantity for the new variant
        }),
      });

      const addedCartData = await addResponse.json();

      console.log("Cart updated:", addedCartData);

      // Update CartDrawer
      const sectionsResponse = await fetch(
        "/?sections=main-cart-items,main-cart-footer,cart-drawer"
      );
      const sections = await sectionsResponse.json();

      // Update main-cart-items
      const newCartItemsHtml = new DOMParser()
        .parseFromString(sections["main-cart-items"], "text/html")
        .querySelector("#cart").innerHTML;
      document.querySelector("#cart").innerHTML = newCartItemsHtml;

      // Update main-cart-footer




      const newCartDrawerHtml = new DOMParser()
        .parseFromString(sections["cart-drawer"], "text/html")
        .querySelector("#CartDrawer").innerHTML;
      document.querySelector("#CartDrawer").innerHTML = newCartDrawerHtml;

      const totals = document.querySelectorAll(".totals__total-value");

if (totals.length > 1) {   // <-- require at least 2 elements
  const drawerPrice = totals[0].innerHTML;
  console.log("Drawer price:", drawerPrice);
  console.log("cart price:", totals[1].innerHTML);
  totals[1].innerHTML = drawerPrice;
}

      // Update Cart Icon Bubble
      // const newCartIconBubbleHtml = new DOMParser().parseFromString(sections["#cart-icon-bubble"], "text/html")
      //   .querySelector("#cart-icon-bubble").innerHTML;
      // document.querySelector("#cart-icon-bubble").innerHTML = newCartIconBubbleHtml;
    } catch (err) {
      console.log("Variant update failed:", err);
    }
  }
});



