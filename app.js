document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Authentication
    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');
    const googleSignInButton = document.getElementById('googleSignInButton');
    const authErrorMsg = document.getElementById('authErrorMsg');
    const logoutBtn = document.getElementById('logoutBtn');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');



    // DOM Elements - Form Fields
    const form = document.getElementById('deviationForm');
    const observationDateInput = document.getElementById('observationDate');
    const briefDescriptionTextarea = document.getElementById('briefDescription');
    const descriptionWordCounter = document.getElementById('descriptionWordCounter');
    const actionTakenTextarea = document.getElementById('actionTaken');
    const actionWordCounter = document.getElementById('actionWordCounter');

    // DOM Elements - Uploader 1 (Deviation Photos)
    const deviationDropzone = document.getElementById('deviationDropzone');
    const deviationPhotoUploadInput = document.getElementById('deviationPhotoUpload');
    const deviationPreviewGrid = document.getElementById('deviationPreviewGrid');

    // DOM Elements - Uploader 2 (Rectification Photos)
    const rectificationDropzone = document.getElementById('rectificationDropzone');
    const rectificationPhotoUploadInput = document.getElementById('rectificationPhotoUpload');
    const rectificationPreviewGrid = document.getElementById('rectificationPreviewGrid');

    // DOM Elements - Conditional Status Checklist
    const statusChecklistContainer = document.getElementById('statusChecklistContainer');

    // DOM Elements - Feedback & Dialogs
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const successOverlay = document.getElementById('successOverlay');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    const toastContainer = document.getElementById('toastContainer');

    // DOM Elements - Success Modal Receipt Fields
    const receiptClassification = document.getElementById('receiptClassification');
    const receiptHazard = document.getElementById('receiptHazard');
    const receiptIncharge = document.getElementById('receiptIncharge');
    const receiptStatus = document.getElementById('receiptStatus');
    const receiptDevPhotos = document.getElementById('receiptDevPhotos');
    const receiptRectPhotos = document.getElementById('receiptRectPhotos');

    // State Variables
    let currentAuthUser = null;
    let deviationFiles = [];
    let rectificationFiles = [];
    const MAX_FILES = 5;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

    // CONFIGURATION: Hardcoded credentials (Change these to your single active credentials)
    const CLIENT_ID = "1084151719721-rf3lhle6mtmdu36nilffnesuq9m0o7ao.apps.googleusercontent.com";
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyjdB4LwLHycR-3xAPcyXkYNEZrFDoX7YNcMyCYySSBHvHIJ1b438CXjgUtnAv3AAnAmg/exec";

    // -------------------------------------------------------------
    // Local Configuration Settings (Google Sheets URL & Client ID)
    // -------------------------------------------------------------
    const getSavedAppsScriptUrl = () => {
        return APPS_SCRIPT_URL;
    };

    const getSavedClientId = () => {
        return CLIENT_ID;
    };

    // Set Default Date as Today
    const setTodayDate = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        observationDateInput.value = `${yyyy}-${mm}-${dd}`;
    };
    setTodayDate();

    // -------------------------------------------------------------
    // JWT Token Parser (Decode Google Identity Credentials)
    // -------------------------------------------------------------
    const decodeJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('JWT Decode Error:', error);
            return null;
        }
    };

    // -------------------------------------------------------------
    // Google Authentication Flow (GSI Library Client)
    // -------------------------------------------------------------
    const handleCredentialResponse = (response) => {
        const payload = decodeJwt(response.credential);
        if (payload) {
            currentAuthUser = {
                name: payload.name,
                email: payload.email,
                picture: payload.picture
            };
            // Save state in session storage to survive refreshes
            sessionStorage.setItem('deviation_logged_user', JSON.stringify(currentAuthUser));
            authSuccess(currentAuthUser);
        } else {
            authErrorMsg.classList.remove('hidden');
            showToast('Google authentication failed. Try again.', 'error');
        }
    };

    const authSuccess = (user) => {
        loginScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userAvatar.src = user.picture || 'https://via.placeholder.com/150';
        userName.textContent = user.name;
        userEmail.textContent = user.email;
        showToast(`Authenticated as ${user.name}`, 'success');
        authErrorMsg.classList.add('hidden');
    };

    const showSDKError = () => {
        authErrorMsg.textContent = 'Google Sign-In SDK failed to load. Please check your internet connection or configure the correct Client ID in settings.';
        authErrorMsg.classList.remove('hidden');
    };

    const initializeGoogleSignIn = () => {
        try {
            google.accounts.id.initialize({
                client_id: getSavedClientId(),
                callback: handleCredentialResponse,
                auto_select: false
            });
            google.accounts.id.renderButton(
                googleSignInButton,
                { theme: "outline", size: "large", width: "100%", text: "signin_with" }
            );
        } catch (error) {
            console.error('Google accounts ID initialization error:', error);
            showSDKError();
        }
    };

    // Logout Action
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('deviation_logged_user');
        currentAuthUser = null;
        appContainer.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        showToast('Signed out successfully.', 'info');
        // Re-render Google button
        initializeGoogleSignIn();
    });

    // Check cached session
    const cachedUser = sessionStorage.getItem('deviation_logged_user');
    if (cachedUser) {
        try {
            currentAuthUser = JSON.parse(cachedUser);
            authSuccess(currentAuthUser);
        } catch (e) {
            sessionStorage.removeItem('deviation_logged_user');
        }
    }

    // Load Google Identity Services SDK script async
    if (typeof google === 'undefined' || !google.accounts) {
        // Fallback checks
        setTimeout(() => {
            if (typeof google !== 'undefined' && google.accounts) {
                initializeGoogleSignIn();
            } else {
                showSDKError();
            }
        }, 1500);
    } else {
        initializeGoogleSignIn();
    }


    // -------------------------------------------------------------
    // Conditional Status Options Checklist (UA / UC Specifics)
    // -------------------------------------------------------------
    const updateStatusOptions = (classification) => {
        statusChecklistContainer.innerHTML = '';
        const options = classification === 'UA' ?
            [{ value: 'UA Open', label: 'UA Open' }, { value: 'UA Close', label: 'UA Close' }] :
            [{ value: 'UC Open', label: 'UC Open' }, { value: 'UC Close', label: 'UC Close' }];

        options.forEach((opt, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'status-check-card';

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'statusSelection';
            input.id = `statusOpt_${index}`;
            input.value = opt.value;
            // Pre-select the open option by default
            if (index === 0) input.checked = true;

            const label = document.createElement('label');
            label.htmlFor = `statusOpt_${index}`;
            label.className = 'status-check-label';

            const indicator = document.createElement('span');
            indicator.className = 'status-indicator';

            const title = document.createElement('span');
            title.className = 'status-title';
            title.textContent = opt.label;

            label.appendChild(indicator);
            label.appendChild(title);
            wrapper.appendChild(input);
            wrapper.appendChild(label);
            statusChecklistContainer.appendChild(wrapper);

            // Add change listener to clear validation errors
            input.addEventListener('change', () => {
                const control = statusChecklistContainer.closest('.form-control');
                if (control) clearControlError(control);
            });
        });
    };

    // Watch UA / UC Radio toggles
    const classificationRadios = document.getElementsByName('uaucClassification');
    classificationRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateStatusOptions(e.target.value);
        });
    });

    // Run initial generation (default is UA)
    updateStatusOptions('UA');


    // -------------------------------------------------------------
    // Word Count Tracker (Brief Description: 50 | Action: 30)
    // -------------------------------------------------------------
    const countWords = (text) => {
        return text.trim().split(/\s+/).filter(w => w.length > 0).length;
    };

    const setupWordCounter = (textarea, display, limit) => {
        const handler = () => {
            const count = countWords(textarea.value);
            display.textContent = `${count} / ${limit} words`;

            if (count > limit) {
                display.className = 'word-counter danger';
            } else if (count > limit - (limit * 0.1)) {
                display.className = 'word-counter warning';
            } else {
                display.className = 'word-counter';
            }
            // Clear highlighting errors if user edits
            const control = textarea.closest('.form-control');
            if (control) clearControlError(control);
        };
        textarea.addEventListener('input', handler);
        textarea.addEventListener('propertychange', handler);
    };

    setupWordCounter(briefDescriptionTextarea, descriptionWordCounter, 50);
    setupWordCounter(actionTakenTextarea, actionWordCounter, 30);


    // -------------------------------------------------------------
    // Drag & Drop Photo Upload Manager (Deviation vs Rectification)
    // -------------------------------------------------------------
    const initFileUploader = (dropzone, fileInput, previewGrid, filesArrayRef, errorLabelId) => {
        // Trigger select dialog
        dropzone.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag/drop triggers
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('dragover');
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            processFiles(dt.files);
        });

        fileInput.addEventListener('change', (e) => {
            processFiles(e.target.files);
        });

        const processFiles = (filesList) => {
            const control = dropzone.closest('.form-control');
            if (control) clearControlError(control);

            for (let i = 0; i < filesList.length; i++) {
                const file = filesList[i];

                if (!file.type.startsWith('image/')) {
                    showToast(`"${file.name}" is not an image file.`, 'error');
                    continue;
                }

                if (file.size > MAX_FILE_SIZE) {
                    showToast(`"${file.name}" exceeds 10MB limit.`, 'error');
                    continue;
                }

                if (filesArrayRef.length >= MAX_FILES) {
                    showToast(`You can upload a maximum of ${MAX_FILES} files.`, 'error');
                    break;
                }

                // Prevent duplicates
                if (filesArrayRef.some(f => f.name === file.name && f.size === file.size)) {
                    continue;
                }

                filesArrayRef.push(file);
            }
            updatePreviews();
            // Reset input values
            fileInput.value = '';
        };

        const updatePreviews = () => {
            previewGrid.innerHTML = '';
            filesArrayRef.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'preview-item';

                const img = document.createElement('img');
                img.className = 'preview-image';
                img.alt = file.name;

                const reader = new FileReader();
                reader.onload = (e) => { img.src = e.target.result; };
                reader.readAsDataURL(file);

                const info = document.createElement('div');
                info.className = 'preview-info';
                info.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn-remove-photo';
                removeBtn.innerHTML = '&times;';
                removeBtn.ariaLabel = `Remove photo ${file.name}`;
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    filesArrayRef.splice(index, 1);
                    updatePreviews();
                });

                item.appendChild(img);
                item.appendChild(info);
                item.appendChild(removeBtn);
                previewGrid.appendChild(item);
            });
        };
    };

    // Initialize both uploaders
    initFileUploader(deviationDropzone, deviationPhotoUploadInput, deviationPreviewGrid, deviationFiles, 'deviationPhotoUploadError');
    initFileUploader(rectificationDropzone, rectificationPhotoUploadInput, rectificationPreviewGrid, rectificationFiles, 'rectificationPhotoUploadError');


    // -------------------------------------------------------------
    // Form Inputs Validation & Field Checks
    // -------------------------------------------------------------
    const textInputs = form.querySelectorAll('input, select, textarea');
    textInputs.forEach(input => {
        input.addEventListener('input', () => {
            const control = input.closest('.form-control');
            if (control) clearControlError(control);
        });
        input.addEventListener('change', () => {
            const control = input.closest('.form-control');
            if (control) clearControlError(control);
        });
    });

    const setControlError = (control, errorMsg = null) => {
        if (!control) return;
        control.classList.add('invalid');
        if (errorMsg) {
            const errSpan = control.querySelector('.error-message');
            if (errSpan) errSpan.textContent = errorMsg;
        }
    };

    const clearControlError = (control) => {
        if (control) control.classList.remove('invalid');
    };

    const validateForm = () => {
        let isValid = true;

        // 1. Observation Date validation (No future dates)
        const dateInput = document.getElementById('observationDate');
        if (!dateInput.value) {
            setControlError(dateInput.closest('.form-control'), 'Date is required.');
            isValid = false;
        } else {
            const selected = new Date(dateInput.value);
            const today = new Date();
            today.setHours(23, 59, 59, 999); // allow full today
            if (selected > today) {
                setControlError(dateInput.closest('.form-control'), 'Date cannot be in the future.');
                isValid = false;
            } else {
                clearControlError(dateInput.closest('.form-control'));
            }
        }

        // 2. Shift validation
        const shiftInput = document.getElementById('shift');
        if (!shiftInput.value) {
            setControlError(shiftInput.closest('.form-control'));
            isValid = false;
        } else {
            clearControlError(shiftInput.closest('.form-control'));
        }

        // 3. Relay validation
        const relayInput = document.getElementById('relay');
        if (!relayInput.value) {
            setControlError(relayInput.closest('.form-control'));
            isValid = false;
        } else {
            clearControlError(relayInput.closest('.form-control'));
        }

        // 4. Shift Incharge validation
        const inchargeInput = document.getElementById('shiftIncharge');
        if (!inchargeInput.value.trim()) {
            setControlError(inchargeInput.closest('.form-control'));
            isValid = false;
        } else {
            clearControlError(inchargeInput.closest('.form-control'));
        }

        // 5. Main Hazard validation
        const hazardInput = document.getElementById('mainHazard');
        if (!hazardInput.value) {
            setControlError(hazardInput.closest('.form-control'));
            isValid = false;
        } else {
            clearControlError(hazardInput.closest('.form-control'));
        }

        // 6. Brief Description validation (Max 50 words)
        const descriptionText = briefDescriptionTextarea.value.trim();
        const descCount = countWords(descriptionText);
        if (!descriptionText) {
            setControlError(briefDescriptionTextarea.closest('.form-control'), 'Description is required.');
            isValid = false;
        } else if (descCount > 50) {
            setControlError(briefDescriptionTextarea.closest('.form-control'), 'Description cannot exceed 50 words.');
            isValid = false;
        } else {
            clearControlError(briefDescriptionTextarea.closest('.form-control'));
        }

        // 7. Responsible Person validation
        const respPersonInput = document.getElementById('responsiblePerson');
        if (!respPersonInput.value.trim()) {
            setControlError(respPersonInput.closest('.form-control'));
            isValid = false;
        } else {
            clearControlError(respPersonInput.closest('.form-control'));
        }

        // 8. Action Taken validation (Max 30 words)
        const actionText = actionTakenTextarea.value.trim();
        const actionCount = countWords(actionText);
        if (!actionText) {
            setControlError(actionTakenTextarea.closest('.form-control'), 'Action taken detail is required.');
            isValid = false;
        } else if (actionCount > 30) {
            setControlError(actionTakenTextarea.closest('.form-control'), 'Action details cannot exceed 30 words.');
            isValid = false;
        } else {
            clearControlError(actionTakenTextarea.closest('.form-control'));
        }

        // 9. Status selection checklist validation
        const statusSelected = form.querySelector('input[name="statusSelection"]:checked');
        if (!statusSelected) {
            setControlError(statusChecklistContainer.closest('.form-control'));
            isValid = false;
        } else {
            clearControlError(statusChecklistContainer.closest('.form-control'));
        }

        return isValid;
    };


    // -------------------------------------------------------------
    // Form Submission & API Integration
    // -------------------------------------------------------------
    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Return base64 content segment
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Client-Side Input Validations
        if (!validateForm()) {
            showToast('Please correct the highlighted errors before submitting.', 'error');
            const firstInvalid = form.querySelector('.form-control.invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // 2. Apps Script Connection Check
        const url = getSavedAppsScriptUrl();
        if (!url) {
            showToast('Google Sheet Web App URL is not set. Setup integration above.', 'error');
            setupGuideSection.classList.remove('hidden');
            setupGuideSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // 3. User Credentials verification
        if (!currentAuthUser) {
            showToast('Session expired. Please sign in again.', 'error');
            appContainer.classList.add('hidden');
            loginScreen.classList.remove('hidden');
            return;
        }

        // 4. Compile Data and Process Base64 Files
        showLoading(true, 'Encoding uploaded files & prepping payload...');

        try {
            // Read Deviation Photos
            const devPhotoPromises = deviationFiles.map(async (file) => {
                const b64 = await getBase64(file);
                return { name: file.name, type: file.type, base64: b64 };
            });
            const devPhotosData = await Promise.all(devPhotoPromises);

            // Read Rectification Photos
            const rectPhotoPromises = rectificationFiles.map(async (file) => {
                const b64 = await getBase64(file);
                return { name: file.name, type: file.type, base64: b64 };
            });
            const rectPhotosData = await Promise.all(rectPhotoPromises);

            // Structure final post payload
            const payload = {
                observationDate: document.getElementById('observationDate').value,
                shift: document.getElementById('shift').value,
                relay: document.getElementById('relay').value,
                shiftIncharge: document.getElementById('shiftIncharge').value.trim(),
                classification: form.querySelector('input[name="uaucClassification"]:checked').value,
                mainHazard: document.getElementById('mainHazard').value,
                briefDescription: briefDescriptionTextarea.value.trim(),
                deviationPhotos: devPhotosData,
                responsiblePerson: document.getElementById('responsiblePerson').value.trim(),
                actionTaken: actionTakenTextarea.value.trim(),
                rectificationPhotos: rectPhotosData,
                status: form.querySelector('input[name="statusSelection"]:checked').value,
                submittedBy: currentAuthUser.name,
                submittedByEmail: currentAuthUser.email
            };

            showLoading(true, 'Saving reports to Google Sheets...');

            // Submitting standard POST
            await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(payload)
            });

            // Submission successful
            showLoading(false);
            triggerSuccess(payload);
        } catch (error) {
            console.error('Submission failed:', error);
            showLoading(false);
            showToast(`Submission error: ${error.message}. Please check URL configs or network connection.`, 'error');
        }
    });

    const showLoading = (show, message = 'Submitting Deviation Report...') => {
        if (show) {
            loadingText.textContent = message;
            loadingOverlay.classList.remove('hidden');
        } else {
            loadingOverlay.classList.add('hidden');
        }
    };

    const triggerSuccess = (data) => {
        // Populate modal values
        receiptClassification.textContent = data.classification;
        receiptHazard.textContent = data.mainHazard;
        receiptIncharge.textContent = data.shiftIncharge;
        receiptStatus.textContent = data.status;

        // Style status badge inside modal
        if (data.status.endsWith('Open')) {
            receiptStatus.className = 'receipt-value status-badge';
        } else {
            receiptStatus.className = 'receipt-value status-badge closed';
        }

        receiptDevPhotos.textContent = `${deviationFiles.length} file(s)`;
        receiptRectPhotos.textContent = `${rectificationFiles.length} file(s)`;

        // Open Success Overlay
        successOverlay.classList.remove('hidden');
    };

    closeSuccessBtn.addEventListener('click', () => {
        successOverlay.classList.add('hidden');
        form.reset();

        // Reset state variables
        deviationFiles = [];
        rectificationFiles = [];
        deviationPreviewGrid.innerHTML = '';
        rectificationPreviewGrid.innerHTML = '';

        // Reset inputs
        setTodayDate();
        descriptionWordCounter.textContent = '0 / 50 words';
        descriptionWordCounter.className = 'word-counter';
        actionWordCounter.textContent = '0 / 30 words';
        actionWordCounter.className = 'word-counter';

        // Re-generate status options (defaults to UA)
        document.getElementById('uaSelect').checked = true;
        updateStatusOptions('UA');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });


    // -------------------------------------------------------------
    // Interactive Toast Notification Elements
    // -------------------------------------------------------------
    const showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const msgSpan = document.createElement('span');
        msgSpan.className = 'toast-message';
        msgSpan.textContent = message;

        toast.appendChild(msgSpan);
        toastContainer.appendChild(toast);

        // Slide in
        setTimeout(() => toast.classList.add('show'), 50);

        // Remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => { toast.remove(); }, 300);
        }, 4000);
    };
});
