document.addEventListener('DOMContentLoaded', () => {
  const toast = document.getElementById('toast');
  const dropZone = document.querySelector(".drop-zone");
  const fileInput = document.querySelector("#fileInput");
  const browseBtn = document.querySelector("#browseBtn");
  const bgProgress = document.querySelector(".bg-progress");
  const progressPercent = document.querySelector("#progressPercent");
  const progressContainer = document.querySelector(".progress-container");
  const progressBar = document.querySelector(".progress-bar");
  const status = document.querySelector(".status");
  const sharingContainer = document.querySelector(".sharing-container");
  const copyURLBtn = document.querySelector("#copyURLBtn");
  const fileURL = document.querySelector("#fileURL");
  const emailForm = document.querySelector("#emailForm");
  const imgBox = document.getElementById("qrCodeContainer");
  const qrImage = document.getElementById("qrImage");

  const baseURL = "https://filenexa-backend.onrender.com";
  // const baseURL = "http://localhost:4000";
  const uploadURL = `${baseURL}/api/files`;
  const emailURL = `${baseURL}/api/files/send`;
  const maxAllowedSize = 100 * 1024 * 1024; // 100MB

  let toastTimer;  // Declare the toastTimer variable

  function showToast(message) {
    toast.querySelector('.message').textContent = message;
    toast.classList.add('show');
    toast.classList.remove('hide');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
    }, 3000); // Hide after 3 seconds
  }

  function closeToast() {
    toast.classList.remove('show');
    toast.classList.add('hide');
  }

  browseBtn.addEventListener("click", () => {
    fileInput.click();
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 1) {
      if (files[0].size < maxAllowedSize) {
        fileInput.files = files;
        uploadFile();
      } else {
        showToast("Max file size is 100MB");
      }
    } else if (files.length > 1) {
      showToast("You can't upload multiple files");
    }
    dropZone.classList.remove("dragged");
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (!dropZone.classList.contains("dragged")) {
      dropZone.classList.add("dragged");
    }
  });

  dropZone.addEventListener("dragleave", (e) => {
    dropZone.classList.remove("dragged");
    console.log("drag ended");
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files[0].size > maxAllowedSize) {
      showToast("Max file size is 100MB");
      fileInput.value = ""; // Reset the input
      return;
    }
    uploadFile();
  });

  copyURLBtn.addEventListener("click", () => {
    fileURL.select();
    document.execCommand("copy");
    showToast("Copied to clipboard");
  });

  fileURL.addEventListener("click", () => {
    fileURL.select();
  });

  const uploadFile = () => {
    console.log("file added uploading");

    const files = fileInput.files;
    const formData = new FormData();
    formData.append("myfile", files[0]);

    // Show the uploader
    progressContainer.style.display = "block";

    // Upload file
    const xhr = new XMLHttpRequest();

    // Listen for upload progress
    xhr.upload.onprogress = function (event) {
      let percent = Math.round((100 * event.loaded) / event.total);
      progressPercent.innerText = percent;
      const scaleX = `scaleX(${percent / 100})`;
      bgProgress.style.transform = scaleX;
      progressBar.style.transform = scaleX;
    };

    // Handle error
    xhr.upload.onerror = function () {
      showToast(`Error in upload: ${xhr.status}.`);
      fileInput.value = ""; // Reset the input
    };

    // Listen for response which will give the link
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        try {
          const response = JSON.parse(xhr.responseText);
          onFileUploadSuccess(response);
        } catch (e) {
          showToast('Error processing server response');
        }
      }
    };

    xhr.open("POST", uploadURL);
    xhr.send(formData);
  };

  const onFileUploadSuccess = (res) => {
    fileInput.value = ""; // Reset the input
    status.innerText = "Uploaded";

    // Remove the disabled attribute from form btn & make text send
    emailForm[2].removeAttribute("disabled");
    emailForm[2].innerText = "Send";
    progressContainer.style.display = "none"; // Hide the box

    const { file: url } = res;
    console.log(url);
    sharingContainer.style.display = "block";
    fileURL.value = url;

    qrImage.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + fileURL.value;
  };

  emailForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Stop submission

    // Disable the button
    emailForm[2].setAttribute("disabled", "true");
    emailForm[2].innerText = "Sending";

    const url = fileURL.value;

    const formData = {
      uuid: url.split("/").splice(-1, 1)[0],
      emailTo: emailForm.elements["to-email"].value,
      emailFrom: emailForm.elements["from-email"].value,
    };
    console.log(formData);
    fetch(emailURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showToast("Email Sent");
          sharingContainer.style.display = "none"; // Hide the box
        }
      })
      .catch((error) => {
        showToast("Error sending email");
      })
      .finally(() => {
        emailForm[2].removeAttribute("disabled");
        emailForm[2].innerText = "Send";
      });
  });
});
