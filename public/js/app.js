// Global Application Interactive Scripts

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Drawer Toggle
  const mobileToggleBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-menu-drawer');
  if (mobileToggleBtn && mobileDrawer) {
    mobileToggleBtn.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
      const isOpen = mobileDrawer.classList.contains('open');
      mobileToggleBtn.setAttribute('aria-expanded', isOpen);
    });
  }

  // 2. Password Visibility Toggle
  document.querySelectorAll('.btn-toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetInputId = btn.getAttribute('data-target');
      const input = document.getElementById(targetInputId);
      if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.innerHTML = isPassword ? '👁️‍🗨️' : '👁️';
      }
    });
  });

  // 3. Password Strength Meter
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

  // 4. OTP 6-Digit Auto-Focus and Paste
  const otpCells = document.querySelectorAll('.otp-cell');
  const otpFullHidden = document.getElementById('otp-full-code');
  if (otpCells.length === 6) {
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

    function updateFullOtp() {
      if (otpFullHidden) {
        const code = Array.from(otpCells).map(c => c.value).join('');
        otpFullHidden.value = code;
      }
    }
  }

  // 5. Generic Modal Handlers
  window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
  };

  window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
  };

  // Close modals on clicking backdrop
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('active');
      }
    });
  });

  // 6. Item Modal Editing Helper
  window.editItemModal = function(itemJson) {
    try {
      const item = typeof itemJson === 'string' ? JSON.parse(itemJson) : itemJson;
      document.getElementById('item-modal-title').textContent = 'Edit Resource Item';
      document.getElementById('item-form').action = `/items/${item.id}/update`;
      document.getElementById('item-title').value = item.title || '';
      document.getElementById('item-category').value = item.category || 'general';
      document.getElementById('item-status').value = item.status || 'active';
      document.getElementById('item-priority').value = item.priority || 'medium';
      document.getElementById('item-description').value = item.description || '';
      document.getElementById('item-tags').value = (item.tags || []).join(', ');
      window.openModal('item-modal');
    } catch (e) {
      console.error(e);
    }
  };

  window.createItemModal = function() {
    document.getElementById('item-modal-title').textContent = 'New Resource Item';
    document.getElementById('item-form').action = '/items/create';
    document.getElementById('item-title').value = '';
    document.getElementById('item-category').value = 'general';
    document.getElementById('item-status').value = 'active';
    document.getElementById('item-priority').value = 'medium';
    document.getElementById('item-description').value = '';
    document.getElementById('item-tags').value = '';
    window.openModal('item-modal');
  };

  window.deleteItemModal = function(id, title) {
    document.getElementById('delete-item-title').textContent = title || 'this resource';
    document.getElementById('delete-item-form').action = `/items/${id}/delete`;
    window.openModal('delete-modal');
  };
});
