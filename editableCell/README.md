editableCell
============

(Currently Chrome support only)

A binding for turning ordinary table cells into selectable, editable cells, 
behaving much like cells in Microsoft Excel, supporting features like applying 
the same change to all selected cells.

### Usage

Table cells bound using the `editableCell` property are selectable and editable. By specifying a `value` and a `formatted` field, a cell may display a formatted value when not edited, e.g.:


```html
<td data-bind="editableCell: nameObservable"></td>
<td data-bind="editableCell: {value: age, formatted: age() + ' years'}"></td>
```
