import { useEffect, useState } from 'preact/hooks'

import { db, db_table } from '../../api/routes'
import { Button, Dialog, Form, Input, Select, TextArea, Checkbox } from '../../ui/aui'

import Table from '../../ui/Table';

function decodeSQLOptions(optionsString) {
	const options = {
	  default: null,
	  notNull: false,
	  unique: false,
	};
  
	// Split the optionsString into individual options
	const optionTokens = optionsString.split(/\s+/);
  
	for (const token of optionTokens) {
	  if (token === 'DEFAULT') {
		const defaultIndex = optionTokens.indexOf(token);
		options.default = optionTokens[defaultIndex + 1];
	  } else if (token === 'NOT' && optionTokens[optionTokens.indexOf(token) + 1] === 'NULL') {
		options.notNull = true;
	  } else if (token === 'UNIQUE') {
		options.unique = true;
	  }
	}
  
	return options;
}
function encodeSQLOptions(options) {
	let optionsString = '';

	if (options.default !== null && options.default !== undefined) {
		optionsString += `DEFAULT ${options.default}`;
	}

	if (options.notNull) {
		if (optionsString.length > 0) {
		optionsString += ' ';
		}
		optionsString += 'NOT NULL';
	}

	if (options.unique) {
		if (optionsString.length > 0) {
		optionsString += ' ';
		}
		optionsString += 'UNIQUE';
	}

	return optionsString;
}

export default function Tables() {
	const [tables, setTables] = useState(null)
	const [table, setTable] = useState(null)

	const [showColumnEditor, setShowColumnEditor] = useState(false)
	const [column, setColumn] = useState(null)

	const [showRowEditor, setShowRowEditor] = useState(false)
	const [row, setRow] = useState(null)

	const loadTable = async (_table) => {
		let columns = _table.columns.split(',')
		columns = columns.filter((column) => column !== 'password')

		const options = _table.options.split(',')
		const mapped_options = []
		options.forEach((option) => {
			const decodedOptions = decodeSQLOptions(option);
			mapped_options.push(decodedOptions)
		})

		let types = _table.types.split(',')

		const rows = await db.read(_table.name)
		const ordered_rows = rows.map((row) => {
			let ordered_row = {}
			columns.forEach((column) => {
				ordered_row[column] = row[column]
			})
			return ordered_row
		})
		
		let newTable = {
			name: _table.name,
			description: _table.description,
			columns,
			options: mapped_options,
			types,
			rows: ordered_rows,
		}

		setTable(newTable)
	}

	const refresh = async () => {
		// find table in tables
		let _table = tables && table && tables.find(t => t.name === table.name)

		let newTables = await db.read('models')
		// omit models table
		newTables = newTables.filter((x) => x.name !== 'models')

		setTables(newTables)

		if (_table) {
			loadTable(_table)
		} else {
			loadTable(newTables[0])
		}
	}

	useEffect(() => {
		refresh()
	}, [])

	const handleCreateTable = async (table) => {
		// await db.create('tables', table)
		console.log(table)
	}

	const handleSelectTable = async (table) => {
		await loadTable(table)
	}

	const data = table && table.rows.map((row) => {
		const newRow = {}
		table.columns.forEach((column) => {
			newRow[column] = row[column]
		})
		return newRow
	})

	const data_columns = table && table.columns.map((column, index) => {
		return column + ' (' + table.types[index] + ')'
	})

	const handleColumnClick = (column_name) => {
		column_name = column_name.split(' (')[0]
		const column_index = table.columns.findIndex((column) => column === column_name)
		const column = {
			name: table.columns[column_index],
			type: table.types[column_index],
			default: table.options[column_index].default,
			primary: table.options[column_index].primary,
			autoIncrement: table.options[column_index].autoIncrement,
			notNull: table.options[column_index].notNull,
			unique: table.options[column_index].unique,
		}
		setColumn(column)
		setShowColumnEditor(true)
	}

	const hanleRowClick = (row) => {
		setRow(row)
		setShowRowEditor(true)
	}

	return ( 	
		<div class="frame">
			<div class="menu">
				<div class="menu-title">
					<h4>Table Editor</h4>
				</div>
				<div class="menu-item">					
					<TableEditor onSubmit={handleCreateTable} />
				</div>
				<div class="menu-item">
					<h6 class="gray">Tables ({tables && tables.length})</h6>
					<div class="menu-item-list">
						{
							tables && tables.map((table) => {
								return (
									<div class="menu-item-list-item" onClick={() => handleSelectTable(table)}>
										{table.name}
									</div>
								)
							})
						}
					</div>
				</div>	
			</div>
			<div class="content">
				{
					table && (
						<>
							<h4>{table.name}</h4>
							<p>{table.description}</p>

							<Table 
								data={data} 
								columns={data_columns}
								onRowClick={row => hanleRowClick(row)}
								onRowCreate={() => setShowRowEditor(true)}
								onColumnClick={column => handleColumnClick(column)}
								onColumnCreate={() => setShowColumnEditor(true)}
							/>

							<ColumnEditor 
								table={table}
								object={column} 
								setObject={setColumn} 
								open={showColumnEditor} 
								setOpen={setShowColumnEditor} 
								refresh={refresh}
							/>

							<RowEditor 
								table={table}
								object={row} 
								setObject={setRow} 
								open={showRowEditor} 
								setOpen={setShowRowEditor} 
								refresh={refresh}
							/>
						</>
					)	
				}
			</div>
		</div>
	)
}

function TableEditor(props) {
	const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
			name: '',
			description: '',
			columns: [
				{
					name: 'id',
					type: 'number',
					defaultValue: '',
					primary: true,
				},
				{
					name: 'created_at',
					type: 'date',
					defaultValue: 'CURRENT_TIMESTAMP',
					primary: false,
				}
			]
		}
        const newObject = {...defaultObject, ...props}

        setObject(newObject)
    }, [props])

	const handleChange = (e) => {
		setObject({...object, [e.target.name]: e.target.value})
	}

	const handleNestedChange = (e) => {
		const [name, index, key] = e.target.name.split('.')
		const value = e.target.value

		const newObject = {...object}
		newObject[name][index][key] = value

		setObject(newObject)
	}

	const handleDeleteRow = (index) => {
		const newObject = {...object}
		newObject.columns.splice(index, 1)
		setObject(newObject)
	}

	const handleAddRow = () => {
		const newObject = {...object}
		newObject.columns.push({
			name: '',
			type: 'string',
			defaultValue: '',
			primary: false,
		})
		setObject(newObject)
	}

	return (
		<>
			{
				object && (
					<Dialog 
						title="Create Table"
						onSubmit={() => props.onSubmit(object)}
					>
						<Input
							label="Name"
							name="name"
							value={object.name}
							onChange={handleChange}
						/>
						<br />
						<Input
							label="Description"
							name="description"
							value={object.description}
							onChange={handleChange}
						/>
						<br />

						<h4>Columns</h4>
						<table>
							<thead>
								<tr>
									<th>Name</th>
									<th>Type</th>
									<th>Default Value</th>
									<th>Primary</th>
									<th>Options</th>
								</tr>
							</thead>
							<tbody>
								{
									object.columns.map((column, index) => {
										return (
											<tr>
												<td>
													<Input
														name={`columns.${index}.name`}
														value={column.name}
														onChange={handleNestedChange}
													/>
												</td>
												<td>
													<select
														name={`columns.${index}.type`}
														value={column.type}
														onChange={handleNestedChange}
														disabled={column.primary}
													>
														<option value="string">String</option>
														<option value="number">Number</option>
														<option value="boolean">Boolean</option>
														<option value="date">Date</option>
													</select>
												</td>
												<td>
													<Input
														name={`columns.${index}.defaultValue`}
														value={column.defaultValue}
														onChange={handleNestedChange}
														disabled={column.primary}
													/>
												</td>
												<td>
													<input
														type="checkbox"
														name={`columns.${index}.primary`}
														checked={column.primary}
														onChange={handleNestedChange}
														disabled
													/>
												</td>
												<td></td>
												<td>
													<Button
														variant="outlined"
														color="alert"
														size="slim"
														onClick={() => handleDeleteRow(index)}
														visible={index > 1}
													>
														Delete
													</Button>
												</td>
											</tr>
										)
									})
								}
							</tbody>
						</table>
						<div class="mt-10">
							<Button
								variant="outlined"
								color="primary"
								size="slim"
								onClick={handleAddRow}
							> 
								Add Row
							</Button>
						</div>
					</Dialog>
				)
			}	
		</>
	)
}

function ColumnEditor(props) {
	const [object, setObject] = useState(null)

	const loadObject = async () => {
		const defaultObject = {
			name: '',
			type: 'TEXT',
			default: null,
			primary: false,
			autoIncrement: false,
			notNull: false,
			unique: false,
		}

        const newObject = {...defaultObject, ...props.object}
        setObject(newObject)
	}

    useEffect(() => {
        loadObject()
    }, [props])

	const handleClose = () => {
		props.setOpen(false)
		props.setObject(null)
		loadObject()
	}

	const handleChange = (e) => {
		if (e.target.type === 'checkbox') {
			setObject({...object, [e.target.name]: e.target.checked})
			return
		}
		setObject({...object, [e.target.name]: e.target.value})
	}

	const handleSubmit = async () => {
		if (props.object) {
			// encode options to string
			const encodedOptions = encodeSQLOptions(object)
			object.options = encodedOptions

			// edit column
			await db_table.update_column(props.table.name, object)

			if (props.object.name != object.name) {
				// rename column
				await db_table.rename_column(props.table.name, props.object.name, object.name)
			}
		} else {
			// create column
			await db_table.create_column(props.table.name, object)
		}

		handleClose()
		props.refresh(props.table)
	}

	const handleDelete = async () => {
		await db_table.delete_column(props.table.name, props.object.name)
		handleClose()
		props.refresh(props.table)
	}

	const title = props.object ? `Edit column` : 'Create Column'

	return (
		<>
			{
				object && (
					<Dialog 
						title={title}
						open={props.open}
						onClose={handleClose}
						onSubmit={handleSubmit}
						onDelete={handleDelete}
						buttonSettings={{
							hidden: true,
						}}
					>
						<Input
							label="Name"
							name="name"
							value={object.name}
							onChange={handleChange}
							placeholder="column_name"
							helperText="Recommended to use lowercase and use an underscore to separate words"
						/>

						<Select
							label="Type"
							name="type"
							value={object.type}
							onChange={handleChange}
							helperText="The type of data the column will store"
						>
							<option value="TEXT">TEXT</option>
							<option value="INTEGER">INTEGER</option>
							<option value="BOOLEAN">BOOLEAN</option>
							<option value="DATETIME">DATETIME</option>
						</Select>

						<Input
							label="Default Value"
							name="default"
							value={object.default
							}
							onChange={handleChange}
							placeholder="NULL"
						/>
						
						<Checkbox
							label="Primary Key"
							name="primary"
							value={object.primary}
							onChange={handleChange}
							disabled
						/>

						<Checkbox	
							label="Auto Increment"
							name="autoIncrement"
							value={object.autoIncrement}
							onChange={handleChange}
							disabled
						/>

						<Checkbox
							label="Not Null"
							name="notNull"
							value={object.notNull}
							onChange={handleChange}
							helperText="If checked, the column cannot be null"
						/>

						<Checkbox
							label="Unique"
							name="unique"
							value={object.unique}
							onChange={handleChange}
							helperText="If checked, the column cannot have duplicate values"
						/>
					</Dialog>
				)
			}	
		</>
	)
}

function RowEditor(props) {
	const [object, setObject] = useState(null)

	const loadObject = async () => {
		const defaultObject = {
			created_at: 'now()',
			updated_at: 'now()',
		}

		// get column names and types from props.table
		const columns = props.table.columns
		const types = props.table.types
		
		if (props.object) {
			// use types to convert props.object values to correct type
			columns.forEach((column, index) => {
				defaultObject[column] = props.object[column]
				if (types[index] === 'INTEGER') {
					defaultObject[column] = parseInt(props.object[column])
				} else if (types[index] === 'BOOLEAN') {
					defaultObject[column] = props.object[column] === 'true'
				} else if (types[index] === 'DATETIME') {
					defaultObject[column] = props.object[column]
				}
			})
		} else {
			// use types to set default values
			columns.forEach((column, index) => {
				defaultObject[column] = ''
				if (types[index] === 'INTEGER') {
					defaultObject[column] = 0
				} else if (types[index] === 'BOOLEAN') {
					defaultObject[column] = false
				} else if (types[index] === 'DATETIME') {
					defaultObject[column] = 'now()'
				}
			})

			// get last id and increment from props.table.rows
			const rows = props.table.rows
			const last_id = parseInt(rows[rows.length - 1].id)
			const new_id = last_id + 1
			defaultObject.id = new_id
		}

		// sort object by order in columns
		const newObject = {}
		
		columns.forEach((column) => {
			newObject[column] = defaultObject[column]
		})
		
        setObject(newObject)
	}

    useEffect(() => {
        loadObject()
    }, [props])

	const handleClose = () => {
		props.setOpen(false)
		props.setObject(null)
		loadObject()
	}

	const handleSubmit = async () => {
		if (props.object) {
			await db.update_by_id(props.table.name, object.id, object)
		} else {
			await db.insert_rows(props.table.name, object)
		}

		handleClose()
		props.refresh(props.table)
	}

	const handleDelete = async () => {
		await db.delete_by_id(props.table.name, object.id)
		handleClose()
		props.refresh(props.table)
	}

	const title = props.object ? `Edit Row` : 'Insert Row'

	return (
		<>
			{
				object && (
					<Dialog 
						title={title}
						open={props.open}
						onClose={handleClose}
						onSubmit={handleSubmit}
						onDelete={props.object && handleDelete}
						buttonSettings={{
							hidden: true,
						}}
					>
						<Form 
							object={object}
							onChange={setObject}
							onSubmit={handleSubmit}
							integrated
						/>
					</Dialog>
				)
			}	
		</>
	)
}