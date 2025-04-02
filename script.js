 document.addEventListener('DOMContentLoaded', function () {
  // File upload display names
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
  input.addEventListener('change', function () {
  const fileNameContainer = document.getElementById(this.id + '_name');
  if (this.files && this.files.length > 0) {
  fileNameContainer.textContent = this.files[0].name;
  } else {
  fileNameContainer.textContent = "Aucun fichier sélectionné";
  }
  });
  });

  // Reset button functionality
  document.getElementById('reset-btn').addEventListener('click', function () {
  document.getElementById('vtc-form').reset();
  fileInputs.forEach(input => {
  document.getElementById(input.id + '_name').textContent = "Aucun fichier sélectionné";
  });
  });

  // Form submission
  document.getElementById('vtc-form').addEventListener('submit', async function (event) {
  event.preventDefault();

  // 1. Upload files to a cloud storage (e.g., Google Cloud Storage, AWS S3)
  const fileUploadPromises = [];
  const uploadedFileUrls = {};

  for (const input of fileInputs) {
  if (input.files && input.files.length > 0) {
  const file = input.files[0];
  fileUploadPromises.push(uploadFile(file, input.name)); // Use input.name as identifier
  }
  }

  try {
  const results = await Promise.all(fileUploadPromises);
  results.forEach(result => {
  uploadedFileUrls[result.fieldName] = result.fileUrl; // Store URL with field name
  });

  // 2. Prepare data for IFTTT
  const formData = new FormData(this);
  const iftttData = {};
  for (const pair of formData.entries()) {
  iftttData[pair[0]] = pair[1];
  }

  // Include the file URLs
  Object.assign(iftttData, uploadedFileUrls);

  // 3. Send data to IFTTT Webhook
  await sendToIFTTT(iftttData);

  alert('Formulaire soumis avec succès!');

  } catch (error) {
  console.error('Error submitting form:', error);
  alert('Erreur lors de la soumission du formulaire.');
  }
  });

  /**
  * Uploads a file to Google Cloud Storage.
  * @param {File} file The file to upload.
  * @param {string} fieldName The field name associated with the file.
  * @returns {Promise<{fieldName: string, fileUrl: string}>} Resolves with the field name and the URL of the uploaded file.
  */
  async function uploadFile(file, fieldName) {
  // Replace with your Google Cloud Storage details
  const projectId = 'your-project-id';
  const bucketName = 'your-bucket-name';
  const apiKey = 'your-api-key'; // Consider using backend for security

  const storageUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${file.name}`;

  try {
  const response = await fetch(storageUrl, {
  method: 'POST',
  headers: {
  'Authorization': `Bearer ${apiKey}`, // Ideally, get this from a server
  'Content-Type': file.type,
  'X-Upload-Content-Type': file.type,
  },
  body: file,
  });

  if (!response.ok) {
  throw new Error(`File upload failed: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  const fileUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`; // Construct the public URL

  return { fieldName: fieldName, fileUrl: fileUrl };

  } catch (error) {
  console.error('Error uploading file:', error);
  throw error; // Re-throw to be caught by the form submission handler
  }
  }

  /**
  * Sends data to IFTTT Webhook.
  * @param {object} data The data to send to IFTTT.
  */
  async function sendToIFTTT(data) {
  const iftttWebhookURL = 'https://maker.ifttt.com/trigger/{event}/json/with/key/{your_ifttt_key}'; // Replace with your IFTTT Webhook URL

  try {
  const response = await fetch(iftttWebhookURL.replace('{event}', 'vtc_form_submission').replace('{your_ifttt_key}', 'YOUR_IFTTT_WEBHOOK_KEY'), {
  method: 'POST',
  headers: {
  'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
  });

  if (!response.ok) {
  throw new Error(`IFTTT request failed: ${response.status} - ${response.statusText}`);
  }

  } catch (error) {
  console.error('Error sending to IFTTT:', error);
  throw error; // Re-throw to be caught by the form submission handler
  }
  }
  });
