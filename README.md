# Knockout-EditableCell

Knockout-EditableCell (or just `editableCell`) is an extension to
[Knockout](http://www.knockoutjs.com) for turning ordinary table cells into
selectable, editable cells, behaving much like cells in Microsoft Excel.

It supports features like:

* Keyboard and mouse navigation
* Cell selection (both via the keyboard and the mouse)
* In-place editing of a Knockout observable
* Additional display customization of the observable value (via `cellText` and `cellHTML` functions)
* Applying a new value to all selected cells (via Ctrl+ENTER)

#### Try out the [demo](http://gnab.github.com/editableCell/)!

_NOTE: At the current time, `editableCell` only supports Chrome (see <a href="https://github.com/gnab/editableCell/issues/27" target="_blank">#27</a> for progress)._

## Requirements

`editableCell` depends upon [Knockout](http://www.knockoutjs.com)s (and therefore has an implicit dependency on jQuery).
v1.0.0 supports Knockout v3.0.0+, and any version of jQuery supported by Knockout.

## Getting Started

### Adding `editableCell` to your project

`editableCell` can be loaded via a normal script tag, or via AMD (like `RequireJS`).

Via a `script` tag:

```html
<!-- Add 'editableCell' right after your current Knockout script -->
<script type="text/javascript" src="http://knockoutjs.com/downloads/knockout-3.2.0.js"></script>
<script type="text/javascript" src="vendor/editableCell.js"></script>
```

Via `RequireJS`:
```javascript
/* Add 'editableCell' to your existing requireJs configuration */

requirejs.config({
    paths: {
        knockout: './node_modules/knockout/build/output/knockout-latest',
        editableCell: './vendor/editableCell.min'
    }
});
```

### Usage

Table cells are bound using an `editableCell` binding, and are (by default) selectable
and editable. You just need to pass a Knockout observable or writeable computed property
to the binding:

```html
<td data-bind="editableCell: name"></td>
```

To customize the default behaviour, you may use the following supplemental binding properties:

 - `cellReadOnly` - Whether or not the cell should be editable. It will always, however, remain selectable.
 - `cellText` - The text to display when the cell is not being edited.
 - `cellHTML` - A more advanced version of `cellText` that allows additional customization.

  Typically, `cellHTML` is bound to function on your view model that returns a string of HTML.
  `editableCell` will automatically call this function with the bound observable's current value,
  and you can return a string containing arbitrary HTML that will be inserted inside the `td`.


```html
<!-- Won't be editable-->
<td data-bind="editableCell: id, cellReadOnly: true"></td>

<!-- Will display '23 years' if age() === 23 -->
<td data-bind="editableCell: age, cellText: age() + ' years'"></td>

<!-- Turns a string into an HTML element inside the TD.
     If the user edits the cell, the function will be called
     with the new 'age' value -->
<td data-bind="editableCell: age, cellHTML: showFancyDivForYear"></td>

```

#### Selection

You can select cells using the mouse (by dragging), or by using the <kbd>Shift + arrow</kbd> keyboard shortcuts.

When you select multiple cells, you typically want to perform an action based on the contents. In order to get the currently selected cells in the table, you can bind an observable array (i.e., `selection` below) to your table using the `editableCellSelection` binding:

```javascript
/* in your viewmodel */
var selection = ko.observableArray();
```
```html
<!-- in your view -->
<table data-bind="editableCellSelection: selection">
```

Whenever the user selects one or more cells in the table, the observable array will be updated. The array will contain:

```javascript
[
  {
    cell: elem /* HTMLTableCellElement */,
	value: val /* the (observable) property that editableCell is bound to */,
	text: txt /* the (observable) property that editableCell is bound to via the 'cellText' binding, or else the same as value */
  },
  /* { ... */
]
```

#### Rows / cells not using `editableCell`

If you have rows or cells that don't use the `editableCell` binding,
or don't use Knockout bindings at all, then `editableCell` won't
navigate to them (using the keyboard, for instance).

If there are rows or cells not using the `editableCell` binding
separating rows or cells that are, then navigation will <strong>hop over</strong>
the unbound cells, similarly to the way navigating between tables (see *Sharing
selection*, below).

#### Copying & Pasting

`editableCell` supports both pasting in structured data to one or more
cells, and copying values from table cells. In the latter case, the values
will be pasted as a <em>tab-delimited</em> array of values.

#### Sharing selection

The parent table uses the `editableCellSelection` binding for keeping
track of selected cells. If two or more tables <strong>share</strong> the same
Knockout observable array in their `editableCellSelection` bindings, then
`editableCell` will:

* ensure that the user can only select cells in one table at a time.
* allow the user to navigate between the linked tables using the keyboard.

#### List of keyboard shortcuts

<dl>
<dt>
<kbd>arrow</kbd> keys
</dt>
<dd>Navigate in the table.</dd>

<dt>
<kbd>Shift</kbd> + <kbd>arrow</kbd>
</dt>
<dd>Select cells in the table.</dd>

<dt>
<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>arrow</kbd>
</dt>
<dd>Select all cells in the table, starting from currently-selected cell.</dd>

<dt>
<kbd>Escape</kbd>
</dt>
<dd>Cancel editing</dd>

<dt>
<kbd>Enter</kbd>
</dt>
<dd>Complete editing. Your change will also be automatically applied if you navigate away from the cell.</dd>

<dt>
<kbd>Ctrl</kbd> + <kbd>Enter</kbd>
</dt>
<dd>If you have multiple cells selected, and begin editing, this will apply the value to all selected cells.</dd>

<dt>
<kbd>Delete</kbd> or <kbd>Ctrl</kbd> + <kbd>Backspace</kbd>
</dt>
<dd>Replaces the current value with `null`, if the underlying observable
supports it.</dd>

</dl>


## Comparision to other editing libraries

Other 'editable' libraries approach the same problem in slightly-different ways.

Some, like <a href="http://vitalets.github.io/x-editable/">x-editable</a> don't
fit particularly well with table-structured data.

Others are wrappers around `contentEditable`. An early version of `editableCell`
tried this, but ran into some issues. <small>(For more details, see <a href="https://github.com/gnab/editableCell/issues/3" target="_blank">issue #3)</a>.

Others, like <a href="www.handsontable.com">Handsontable</a>, <a href-"https://github.com/Knockout-Contrib/KoGrid">ko-grid</a>, and others, are
very focused on controlling the entire table 'surface'. We wanted to be able to
(potentially) make only a single row (or even cell) editable.

Finally, we wanted to fit well in a project already using `Knockout`.

## License

This project is licensed under the MIT license.
