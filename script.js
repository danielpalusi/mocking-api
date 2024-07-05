'use strict';

// Query Selector
const table = document.querySelector('.content-table');
const contentButtonEl = document.querySelector('.content-button');
const popupButtonEl = document.querySelector('.popup-button__cancel');
const popupEl = document.querySelector('.popup');
const tbodyEl = table.querySelector('tbody');
const popupTitleEl = document.querySelector('.popup-title');
const popupAddEditEl = document.querySelector('.popup-button__add');
const nameEl = document.querySelector('.name');
const methodEl = document.querySelector('.method');
const pathEl = document.querySelector('.path');
const responseCodeEl = document.querySelector('.response-code');
const requestEl = document.querySelector('.request');
const responseEl = document.querySelector('.response');
//

// API
const mockingAPI = 'https://mocking-api-da4e905b3a6f.herokuapp.com';
const mockAPIPath = '/api/v1/mock';
//

const getJSON = function (url, method, body, authToken) {
  const options = {
    method,
  };

  if (authToken) {
    options.headers = { Authorization: `Bearer ${authToken}` };
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  return fetch(url, options).then(res => {
    if (!res.ok) throw new Error(`Fail to fetch (${res.status})`);
    return res.json();
  });
};

// Table
const pageSize = 25;
let currentPage = 1;
let tableData = [];

let popupMethod = 'POST';
let editedID;

const formattedObjectText = obj => JSON.stringify(obj, null, 2);

// Pagination Control
const updatePaginationControls = function () {
  const numPages = Math.ceil(tableData.total_element / pageSize);
  const paginationControls = document.querySelector('.content-pagination');

  let paginationHTML = '';

  if (currentPage > 1) {
    paginationHTML +=
      '<button class="content-pagination__button" data-page="prev">&lt;</button>';
  }

  for (let i = 1; i <= numPages; i++) {
    paginationHTML += `<button class="content-pagination__button" data-page="${i}">${i}</button>`;
  }

  if (currentPage < numPages) {
    paginationHTML +=
      '<button class="content-pagination__button" data-page="next">&gt;</button>';
  }

  paginationControls.innerHTML = paginationHTML;

  const paginationButtons = document.querySelectorAll(
    '.content-pagination__button'
  );

  paginationButtons.forEach(button => {
    button.addEventListener('click', function () {
      const page = this.dataset.page;

      if (page === 'prev') {
        currentPage--;
      } else if (page === 'next') {
        currentPage++;
      } else {
        currentPage = parseInt(page);
      }
      // Initiative I - listen click event on paginationControls
      // pros: no eventListener to every button, performance ⤴

      showPage(currentPage, true);
      updatePaginationControls();
    });
  });
};

const showPage = async function (page, status = false) {
  //update table - GET
  if (status) {
    await updateTableContent();
  }
  const contentPaginationButtons = [
    ...document.querySelectorAll('.content-pagination__button'),
  ];
  contentPaginationButtons.forEach(btn => btn.classList.remove('page-active'));
  const activeButton = contentPaginationButtons.find(
    btn => btn.dataset.page == page
  );
  activeButton.classList.add('page-active');

  // const start = (page - 1) * pageSize;
  const start = 0;
  const end = start + pageSize;

  for (let i = 0; i < tbodyEl.rows.length; i++) {
    if (i >= start && i < end) {
      tbodyEl.rows[i].style.display = '';
    } else {
      tbodyEl.rows[i].style.display = 'none';
    }
  }
};

contentButtonEl.addEventListener('click', function () {
  popupTitleEl.textContent = 'Add API';
  popupAddEditEl.textContent = 'Add API';
  nameEl.value =
    methodEl.value =
    pathEl.value =
    responseCodeEl.value =
    requestEl.value =
    responseEl.value =
      '';

  popupMethod = 'POST';
  popupEl.style.display = 'flex';
});

popupButtonEl.addEventListener('click', function () {
  popupEl.style.display = 'none';
});

const fetchAddUpdate = async () => {
  const isAllFieldFilled =
    nameEl.value &&
    methodEl.value &&
    pathEl.value &&
    responseCodeEl.value &&
    responseEl.value;

  if (!isAllFieldFilled) {
    return showNotification('Please fill in the required fields 👇', false);
  }

  const body = {
    name: nameEl.value,
    method: methodEl.value,
    path: pathEl.value,
    response_code: parseInt(responseCodeEl.value),
    request: requestEl.value || null,
    response: responseEl.value,
  };

  if (popupMethod === 'PUT') {
    body.id = parseInt(editedID);
  }

  try {
    await getJSON(`${mockingAPI}${mockAPIPath}`, popupMethod, body).then(() => {
      tbodyEl.innerHTML = '';
      updateTableContent();
    });

    popupEl.style.display = 'none';

    nameEl.value =
      methodEl.value =
      pathEl.value =
      responseCodeEl.value =
      requestEl.value =
      responseEl.value =
        '';

    showNotification('✅ Success', true);
    updatePaginationControls();
    showPage(currentPage, true);
  } catch (err) {
    showNotification(
      `❌ Failed to add/update data ,error:${err.message}`,
      false
    );
  }
};

popupAddEditEl.addEventListener('click', fetchAddUpdate);

const showNotification = function (message, status) {
  const notificationElement = document.querySelector('.notification');

  notificationElement.textContent = message;
  notificationElement.classList.add('show');

  notificationElement.style.backgroundColor = `${
    status ? '#95e1d3' : '#f38181'
  }`;
  notificationElement.style.color = `${status ? '#3e5d57' : '#733b3b'}`;

  setTimeout(function () {
    notificationElement.classList.remove('show');
  }, 3000);
};

const updateTableContent = async function () {
  try {
    tableData = await getJSON(
      `${mockingAPI}${mockAPIPath}?page=${currentPage - 1}&limit=${pageSize}`,
      'GET'
    );
    //pakai then harusnya, soalnya di await, bakal jalan async, sedangkan tableData dibawah
    //udah kita consume
    console.log(tableData);
    let html = '';
    tableData.mock.forEach(mock => {
      html += `
      <tr>
        <td>${mock.name}</td>
        <td>${mock.method}</td>
        <td class="td-url">
          <div>
            ${mockingAPI}${mock.path}
          </div>
          <div>
            <button class="content-url button-copy" data-path=${
              mock.path
            } data-method=${mock.method}>Copy URL</button>
            <button class="content-url button-copyCURL" data-path=${
              mock.path
            } data-method=${mock.method}>Copy CURL</button>
          </div>
        </td>
        <td>${mock.response_code}</td>
        <td><pre>${
          mock.request ? formattedObjectText(mock.request) : '-'
        }</pre></td>
        <td><pre>${
          mock.response && formattedObjectText(mock.response)
        }</pre></td>
        <td class="content-modify">
        <button class="edit" data-id=${mock.id}>✏️</button>
        <button class="delete" data-id=${mock.id}>🗑️</button></td>
      </tr>
    `;
    });

    tbodyEl.innerHTML = '';
    tbodyEl.insertAdjacentHTML('afterbegin', html);

    const tdElements = document.querySelectorAll('.td-url');
    tdElements.forEach(el => {
      el.addEventListener('click', function (event) {
        if (event.target.classList.contains('content-url')) {
          const { path, method } = event.target.dataset;
          let copiedText;
          if (event.target.classList.contains('button-copy')) {
            copiedText = `${mockingAPI}${path}`;
          } else {
            copiedText =
              method === 'GET'
                ? `curl ${mockingAPI}${path}`
                : `curl --request ${method} ${mockingAPI}${path}`;
          }
          navigator.clipboard.writeText(copiedText);
          showNotification('🗂️ Copied to clipboard!', true);
        }
      });
    });
  } catch (err) {
    showNotification(`Fail to fetch 😞, error: ${err.message}`);
  }
};

const init = async function () {
  console.log('trig init');
  try {
    await updateTableContent();

    //edit button handler
    tbodyEl.addEventListener('click', async function (event) {
      if (event.target.classList.contains('edit')) {
        const { id } = event.target.dataset;
        const targetData = tableData.mock.find(arr => arr.id == id);

        popupTitleEl.textContent = 'Edit API';
        popupAddEditEl.textContent = 'Edit Mock';

        nameEl.value = targetData.name;
        methodEl.value = targetData.method.toUpperCase();
        pathEl.value = targetData.path;
        responseCodeEl.value = targetData.response_code;
        requestEl.value = JSON.stringify(targetData.request);
        responseEl.value = JSON.stringify(targetData.response);

        popupMethod = 'PUT';
        editedID = targetData.id;
        popupEl.style.display = 'flex';
      }

      if (event.target.classList.contains('delete')) {
        try {
          const { id } = event.target.dataset;
          await getJSON(`${mockingAPI}${mockAPIPath}?id=${id}`, 'DELETE').then(
            () => {
              showNotification(`✅ Success to delete the API`, true);
              currentPage = 1;
              updatePaginationControls();
              showPage(currentPage, true);
            }
          );
          // Inititative II - Merge post-put & delete methods into one function
        } catch (error) {
          showNotification(`❎ Failed to delete the API`, false);
        }
      }
    });

    updatePaginationControls();
    showPage(currentPage);
  } catch (err) {
    showNotification(`Fail to fetch data 🥲`, false);
  }
};

// Inititative III: Add loading when fetching (button, skeleton loading)

document.addEventListener('DOMContentLoaded', function () {
  const requestField = document.querySelector('.request');
  const responseField = document.querySelector('.response');

  requestField.placeholder = formattedObjectText({
    firstName: 'secret',
    lastName: 'secret',
  });

  responseField.placeholder = formattedObjectText({ message: 'success' });

  init();
});
