
const map = L.map('map').setView([25.3176, 82.9739], 13);



L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
  attribution:'© OpenStreetMap contributors'
}).addTo(map);



let reports =
JSON.parse(localStorage.getItem('smartBins')) || [];



const form =
document.getElementById('binForm');

const reportsContainer =
document.getElementById('reportsContainer');

const totalBins =
document.getElementById('totalBins');

const overflowingBins =
document.getElementById('overflowingBins');

const cleanedBins =
document.getElementById('cleanedBins');

const imageInput =
document.getElementById('image');

const preview =
document.getElementById('preview');

// Image Preview

imageInput.addEventListener('change', function(){

  const file = this.files[0];

  if(file){

    const reader = new FileReader();

    reader.onload = function(e){

      preview.src = e.target.result;

      preview.style.display = 'block';

    };

    reader.readAsDataURL(file);

  }

});

// Load Existing Reports

renderReports();



form.addEventListener('submit', function(e){

  e.preventDefault();

  const title =
  document.getElementById('title').value;

  const type =
  document.getElementById('type').value;

  const description =
  document.getElementById('description').value;

  const location =
  document.getElementById('location').value;


  const levels = [35, 52, 74, 89, 96];

  const fillLevel =
  levels[Math.floor(Math.random()*levels.length)];



  fetch(
  `https://nominatim.openstreetmap.org/search?format=json&q=${location}`
  )

  .then(response => response.json())

  .then(data => {

    if(data.length === 0){

      alert("Location not found");

      return;

    }

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);

    let imageData = '';

    const file = imageInput.files[0];

    if(file){

      const reader = new FileReader();

      reader.onload = function(event){

        imageData = event.target.result;

        saveReport(imageData, lat, lng);

      };

      reader.readAsDataURL(file);

    }else{

      saveReport('', lat, lng);

    }

  });



  function saveReport(image, lat, lng){

    const report = {

      id:Date.now(),

      title,
      type,
      description,
      location,

      fillLevel,

      lat,
      lng,

      image,

      status:'Pending'

    };

    reports.push(report);

    saveLocal();

    renderReports();

    form.reset();

    preview.style.display='none';

  }

});



function saveLocal(){

  localStorage.setItem(
    'smartBins',
    JSON.stringify(reports)
  );

}

// Render Reports

function renderReports(){

  reportsContainer.innerHTML='';

  // Remove Old Markers

  map.eachLayer(layer=>{

    if(layer instanceof L.Marker){
      map.removeLayer(layer);
    }

  });

  // Re-add Tile Layer

  L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution:'© OpenStreetMap contributors'
  }).addTo(map);

  let cleaned = 0;
  let overflowing = 0;

  reports.forEach(report=>{

    if(report.fillLevel >= 80){
      overflowing++;
    }

    if(report.status === 'Cleaned'){
      cleaned++;
    }

    // Create Card

    const card =
    document.createElement('div');

    card.classList.add('report-card');

    card.innerHTML = `

      ${
        report.image
        ?
        `<img src="${report.image}">`
        :
        ''
      }

      <h3>${report.title}</h3>

      <p><b>Type:</b> ${report.type}</p>

      <p><b>Location:</b> ${report.location}</p>

      <p>${report.description}</p>

      <p>
        <b>AI Fill Prediction:</b>
        ${report.fillLevel}%
      </p>

      <div class="status
      ${
        report.status === 'Cleaned'
        ? 'cleaned'
        : 'pending'
      }">

      ${report.status}

      </div>

      <div class="actions">

        <button
        class="clean-btn"
        onclick="toggleClean(${report.id})">

        ${
          report.status === 'Cleaned'
          ? 'Mark Pending'
          : 'Mark Cleaned'
        }

        </button>

        <button
        class="delete-btn"
        onclick="deleteReport(${report.id})">

        Delete

        </button>

      </div>

    `;

    reportsContainer.appendChild(card);

    // Marker

    const marker =
    L.marker([report.lat,report.lng]).addTo(map);

    marker.bindPopup(`

      <h3>${report.title}</h3>

      <p>${report.location}</p>

      <p>Fill Level:
      ${report.fillLevel}%</p>

      <p>Status:
      ${report.status}</p>

    `);

    // Move Map

    map.setView([report.lat, report.lng], 15);

  });

  // Update Stats

  totalBins.innerText =
  reports.length;

  overflowingBins.innerText =
  overflowing;

  cleanedBins.innerText =
  cleaned;

}

// Toggle Status

function toggleClean(id){

  reports = reports.map(report=>{

    if(report.id === id){

      report.status =
      report.status === 'Cleaned'
      ? 'Pending'
      : 'Cleaned';

    }

    return report;

  });

  saveLocal();

  renderReports();

}

// Delete Report

function deleteReport(id){

  reports =
  reports.filter(report=>report.id !== id);

  saveLocal();

  renderReports();

}
