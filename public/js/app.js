/**
 * Farmanullah Company SMTP & Auth Suite
 * Production-ready Client Interactive Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // ─── 1. Accessible Modal System ───
  let lastFocusedElement = null;

  window.openModal = function (id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    // Focus first interactive control in modal
    const focusable = modal.querySelectorAll('input:not([type="hidden"]), select, textarea, button:not([disabled])');
    if (focusable.length > 0) {
      setTimeout(() => focusable[0].focus(), 50);
    }
  };

  window.closeModal = function (id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  };

  // Delegated click for open / close modal buttons
  document.addEventListener('click', (e) => {
    const openBtn = e.target.closest('.btn-open-modal');
    if (openBtn) {
      const modalId = openBtn.getAttribute('data-modal');
      if (modalId) window.openModal(modalId);
      return;
    }

    const closeBtn = e.target.closest('.btn-close-modal');
    if (closeBtn) {
      const modalId = closeBtn.getAttribute('data-modal') || closeBtn.closest('.modal-backdrop')?.id;
      if (modalId) window.closeModal(modalId);
      return;
    }

    // Click on backdrop directly dismisses modal
    if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('active');
      e.target.setAttribute('aria-hidden', 'true');
    }
  });

  // Escape key closes any active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-backdrop.active');
      if (activeModal) {
        window.closeModal(activeModal.id);
      }
    }
  });

  // ─── 2. Mobile Menu Drawer Toggle ───
  const mobileToggleBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-menu-drawer');
  if (mobileToggleBtn && mobileDrawer) {
    mobileToggleBtn.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
      const isOpen = mobileDrawer.classList.contains('open');
      mobileToggleBtn.setAttribute('aria-expanded', isOpen);
    });
  }

  // ─── 3. Password Visibility Toggle ───
  document.querySelectorAll('.btn-toggle-password').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetInputId = btn.getAttribute('data-target');
      const input = document.getElementById(targetInputId);
      if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.innerHTML = isPassword ? '👁️‍🗨️' : '👁️';
        btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      }
    });
  });

  // ─── 4. Password Strength Meter ───
  const pwInput = document.getElementById('signup-password') || document.getElementById('new-password');
  const pwBar = document.getElementById('pw-strength-bar');
  const pwLabel = document.getElementById('pw-strength-label');
  if (pwInput && pwBar && pwLabel) {
    pwInput.addEventListener('input', () => {
      const val = pwInput.value;
      if (!val) {
        pwBar.style.width = '0%';
        pwLabel.textContent = '';
        return;
      }
      let score = 0;
      if (val.length >= 8) score++;
      if (/[a-z]/.test(val) && /[A-Z]/.test(val)) score++;
      if (/\d/.test(val)) score++;
      if (/[^a-zA-Z0-9]/.test(val)) score++;

      if (score <= 1) {
        pwBar.style.width = '25%';
        pwBar.style.backgroundColor = '#f43f5e';
        pwLabel.textContent = 'Weak';
        pwLabel.style.color = '#f43f5e';
      } else if (score === 2) {
        pwBar.style.width = '50%';
        pwBar.style.backgroundColor = '#f59e0b';
        pwLabel.textContent = 'Fair';
        pwLabel.style.color = '#f59e0b';
      } else if (score === 3) {
        pwBar.style.width = '75%';
        pwBar.style.backgroundColor = '#38bdf8';
        pwLabel.textContent = 'Good';
        pwLabel.style.color = '#38bdf8';
      } else {
        pwBar.style.width = '100%';
        pwBar.style.backgroundColor = '#10b981';
        pwLabel.textContent = 'Strong';
        pwLabel.style.color = '#10b981';
      }
    });
  }

  // ─── 5. OTP 6-Digit Auto-Focus and Paste ───
  const otpCells = document.querySelectorAll('.otp-cell');
  const otpFullHidden = document.getElementById('otp-full-code');
  const otpForm = document.getElementById('otp-form');

  if (otpCells.length === 6) {
    const updateFullOtp = () => {
      if (otpFullHidden) {
        const code = Array.from(otpCells).map((c) => c.value).join('');
        otpFullHidden.value = code;
      }
    };

    otpCells.forEach((cell, idx) => {
      cell.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        cell.value = val ? val[0] : '';
        if (val && idx < 5) {
          otpCells[idx + 1].focus();
        }
        updateFullOtp();
      });

      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !cell.value && idx > 0) {
          otpCells[idx - 1].focus();
        }
      });

      cell.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
        if (pasteData) {
          for (let i = 0; i < 6; i++) {
            if (i < pasteData.length) {
              otpCells[i].value = pasteData[i];
            }
          }
          const focusIdx = Math.min(pasteData.length, 5);
          otpCells[focusIdx].focus();
          updateFullOtp();
        }
      });
    });

    if (otpForm) {
      otpForm.addEventListener('submit', (e) => {
        updateFullOtp();
        if (!otpFullHidden.value || otpFullHidden.value.length < 6) {
          e.preventDefault();
          for (let i = 0; i < otpCells.length; i++) {
            if (!otpCells[i].value) {
              otpCells[i].focus();
              break;
            }
          }
        }
      });
    }
  }

  // ─── 6. Resource Item Modals (Create, Edit, Delete) ───
  window.createItemModal = function () {
    const titleEl = document.getElementById('item-modal-title');
    const formEl = document.getElementById('item-form');
    if (titleEl) titleEl.textContent = 'New Resource Item';
    if (formEl) formEl.action = '/items/create';

    const titleInput = document.getElementById('item-title');
    const categorySelect = document.getElementById('item-category');
    const statusSelect = document.getElementById('item-status');
    const prioritySelect = document.getElementById('item-priority');
    const descInput = document.getElementById('item-description');
    const tagsInput = document.getElementById('item-tags');

    if (titleInput) titleInput.value = '';
    if (categorySelect) categorySelect.value = 'general';
    if (statusSelect) statusSelect.value = 'active';
    if (prioritySelect) prioritySelect.value = 'medium';
    if (descInput) descInput.value = '';
    if (tagsInput) tagsInput.value = '';

    window.openModal('item-modal');
  };

  window.editItemModal = function (itemData) {
    try {
      const item = typeof itemData === 'string' ? JSON.parse(itemData) : itemData;
      const titleEl = document.getElementById('item-modal-title');
      const formEl = document.getElementById('item-form');
      if (titleEl) titleEl.textContent = 'Edit Resource Item';
      if (formEl) formEl.action = `/items/${item.id}/update`;

      const titleInput = document.getElementById('item-title');
      const categorySelect = document.getElementById('item-category');
      const statusSelect = document.getElementById('item-status');
      const prioritySelect = document.getElementById('item-priority');
      const descInput = document.getElementById('item-description');
      const tagsInput = document.getElementById('item-tags');

      if (titleInput) titleInput.value = item.title || '';
      if (categorySelect) categorySelect.value = item.category || 'general';
      if (statusSelect) statusSelect.value = item.status || 'active';
      if (prioritySelect) prioritySelect.value = item.priority || 'medium';
      if (descInput) descInput.value = item.description || '';
      if (tagsInput) tagsInput.value = Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '';

      window.openModal('item-modal');
    } catch (err) {
      console.error('Failed to open edit modal:', err);
    }
  };

  window.deleteItemModal = function (id, title) {
    const titleEl = document.getElementById('delete-item-title');
    const formEl = document.getElementById('delete-item-form');
    if (titleEl) titleEl.textContent = title || 'this resource';
    if (formEl) formEl.action = `/items/${id}/delete`;
    window.openModal('delete-modal');
  };

  // Delegated event listeners for resource buttons
  document.addEventListener('click', (e) => {
    // Edit item
    const editBtn = e.target.closest('.btn-edit-item');
    if (editBtn) {
      const rawData = editBtn.getAttribute('data-item');
      if (rawData) {
        try {
          const item = JSON.parse(decodeURIComponent(rawData));
          window.editItemModal(item);
        } catch (err) {
          console.error('Error parsing item data:', err);
        }
      }
      return;
    }

    // Delete item
    const deleteBtn = e.target.closest('.btn-delete-item');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      const title = deleteBtn.getAttribute('data-title');
      if (id) window.deleteItemModal(id, title);
      return;
    }

    // Create item buttons
    if (e.target.closest('#btn-create-item') || e.target.closest('#btn-create-first-item')) {
      window.createItemModal();
    }
  });

  // ─── 7. Template Preview Device Switcher & URL Copy ───
  document.querySelectorAll('.btn-device-switch').forEach((btn) => {
    btn.addEventListener('click', () => {
      const device = btn.getAttribute('data-device');
      const wrapper = document.getElementById('preview-wrapper');
      const btnDesktop = document.getElementById('btn-device-desktop');
      const btnMobile = document.getElementById('btn-device-mobile');

      if (!wrapper) return;

      if (device === 'mobile') {
        wrapper.style.maxWidth = '375px';
        if (btnMobile) {
          btnMobile.classList.add('btn-primary');
          btnMobile.classList.remove('btn-secondary');
          btnMobile.setAttribute('aria-pressed', 'true');
        }
        if (btnDesktop) {
          btnDesktop.classList.add('btn-secondary');
          btnDesktop.classList.remove('btn-primary');
          btnDesktop.setAttribute('aria-pressed', 'false');
        }
      } else {
        wrapper.style.maxWidth = '720px';
        if (btnDesktop) {
          btnDesktop.classList.add('btn-primary');
          btnDesktop.classList.remove('btn-secondary');
          btnDesktop.setAttribute('aria-pressed', 'true');
        }
        if (btnMobile) {
          btnMobile.classList.add('btn-secondary');
          btnMobile.classList.remove('btn-primary');
          btnMobile.setAttribute('aria-pressed', 'false');
        }
      }
    });
  });

  // Copy Preview Link to Clipboard
  const copyBtn = document.getElementById('btn-copy-preview-link');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const path = copyBtn.getAttribute('data-url');
      const fullUrl = window.location.origin + path;
      try {
        await navigator.clipboard.writeText(fullUrl);
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '✅ Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    });
  }

  // ─── 8. Flash Notification Dismissal ───
  document.querySelectorAll('.alert-dismiss-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const alert = btn.closest('.alert');
      if (alert) {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 300);
      }
    });
  });

  // Auto-dismiss alerts after 6 seconds
  setTimeout(() => {
    document.querySelectorAll('.flash-container .alert').forEach((alert) => {
      alert.classList.add('fade-out');
      setTimeout(() => alert.remove(), 300);
    });
  }, 6000);
});
