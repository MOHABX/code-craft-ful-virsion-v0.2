const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const progressBar = document.getElementById('progressBar');
const progressCont = document.getElementById('progressCont');
const percentText = document.getElementById('percentText');
const statusText = document.getElementById('statusText');
const submitBtn = document.getElementById('submitBtn');

dropZone.onclick = () => fileInput.click();

fileInput.onchange = e => handleUpload(e.target.files[0]);

dropZone.ondragover = e => {
e.preventDefault();
dropZone.classList.add('drag-over');
};

dropZone.ondragleave = () =>
dropZone.classList.remove('drag-over');

dropZone.ondrop = e => {
e.preventDefault();
dropZone.classList.remove('drag-over');
handleUpload(e.dataTransfer.files[0]);
};

function handleUpload(file){
if(!file) return;

statusText.innerText = `Uploading: ${file.name}`;

progressCont.style.display = 'block';
percentText.style.display = 'block';

let width = 0;

const interval = setInterval(()=>{
if(width >= 100){
clearInterval(interval);
statusText.innerText = "✅ File Ready for Submission";
}
else{
width += 5;
progressBar.style.width = width + '%';
percentText.innerText = width + '% Complete';
}
},100);
}

// إرسال
submitBtn.onclick = () => {

const studentName = document.getElementById("studentName").value;
const studentId = document.getElementById("studentId").value;
const sidebarMessage = document.getElementById("sidebarMessage");

// جلب اسم الملف المرفوع
const file = fileInput.files[0];
const fileName = file ? file.name : "No file uploaded";

submitBtn.disabled = true;
submitBtn.innerText = "Sending... ⏳";

setTimeout(() => {

sidebarMessage.innerHTML = `
🎉 Assignment submitted successfully! <br>
Student Name: ${studentName} <br>
Student ID: ${studentId} <br>
Assignment: ${fileName}
`;

submitBtn.innerText = "Submitted ✅";

}, 2000);
};
