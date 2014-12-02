editableCell
============

(Currently Chrome support only)

A binding for turning ordinary table cells into selectable, editable cells,
behaving much like cells in Microsoft Excel, supporting features like applying
the same change to all selected cells.

### Usage

Table cells bound using the `editableCell` property are by default selectable and editable.

To customize the default behaviour, you may use the following supplemental bindings:

 - `cellReadOnly` - Whether or not the cell should be just selectable and not editable
 - `cellText` - The cell text to display when the cell is not being edited

Example illustrating how the `editableBinding` may be used:

```html
<td data-bind="editableCell: id, cellReadOnly: true"></td>
<td data-bind="editableCell: name"></td>
<td data-bind="editableCell: age, cellText: age() + ' years'"></td>
```

To get hold of the currently selected cells in the table, you can bind an observable array, i.e. `selection`, to your table using the `editableCellSelection` binding:

```html
<table data-bind="editableCellSelection: selection">
```

Whenever the selection changes, the observable array `selection` will be populated with the list of selected cells on the following format:

```javascript
[
  {
    cell: [the HTMLTableCellElement],
	value: [the (observable) property the cell is bound to with the editableCell binding],
	text: [the (observable) property the cell is bound to with the cellText binding, or else same as value]
  },
  ...
]
```

### Demo

Check out the live [demo](http://gnab.github.com/editableCell/).

### License

This project is licensed under the MIT license.
