module.exports = {
    createCell: createCell,
    createElement: createElement,
    addCell: addCell
};

function createCell (dataBind) {
    var container = document.createElement('div'),
        table = document.createElement('table'),
        tbody = document.createElement('tbody'),
        tr =  document.createElement('tr'),
        td = createElement('td', dataBind);

    container.appendChild(table);
    table.appendChild(tbody);
    tbody.appendChild(tr);
    tr.appendChild(td);

    return td;
}

function createElement (tag, dataBind) {
    var element = document.createElement(tag);

    element.setAttribute('data-bind', dataBind);

    return element;
}

function addCell (parentRow, dataBind) {
    var td = createElement('td', dataBind);
    parentRow.appendChild(td);
    return td;
}