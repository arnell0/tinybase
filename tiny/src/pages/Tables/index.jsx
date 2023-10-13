import { useEffect, useState } from 'preact/hooks'

import { db } from '../../api/routes'

import { Button, Dialog, Form, Input, Select, TextArea } from '../../ui/aui'

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

	const loadTable = async (table) => {
		let columns = table.columns.split(',')
		columns = columns.filter((column) => column !== 'password')

		const options = table.options.split(',')
		const mapped_options = []
		options.forEach((option) => {
			const decodedOptions = decodeSQLOptions(option);
			mapped_options.push(decodedOptions)
		})

		let types = table.types.split(',')

		const rows = await db.read(table.name)
		const ordered_rows = rows.map((row) => {
			let ordered_row = {}
			columns.forEach((column) => {
				ordered_row[column] = row[column]
			})
			return ordered_row
		})
		
		let newTable = {
			name: table.name,
			description: table.description,
			columns,
			options: mapped_options,
			types,
			rows: ordered_rows,
		}

		setTable(newTable)
		console.log(newTable)
	}

	useEffect(() => {
		db.read('models').then((tables) => {
			setTables(tables)
			loadTable(tables[0])
		})
	}, [])

	const handleCreateTable = async (table) => {
		// await db.create('tables', table)
		console.log(table)
	}

	const handleSelectTable = (table) => {
		loadTable(table)
	}

	const handleAddColumn = (column) => {
		
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
							<table>
								<thead>
									<tr>
										{
											table.columns.map((column, index) => {
												return (
													<th>{column} ({table.types[index]})</th>
												)
											})
										}
										<th>
											<ColumnEditor onSubmit={handleAddColumn} />
										</th>
									</tr>
								</thead>
								<tbody>
									{
										table.rows.map((row) => {
											return (
												<tr>
													{
														table.columns.map((column) => {
															return (
																<td>{row[column]}</td>
															)
														})
													}
												</tr>
											)
										})
									}
								</tbody>
							</table>
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

    useEffect(() => {
        const defaultObject = {
			name: '',
			type: 'text',
			default: null,
			notNull: false,
			unique: false,
		}

		const {onSubmit, ...rest} = props
        const newObject = {...defaultObject, ...rest}

        setObject(newObject)
    }, [props])

	const handleChange = (e) => {
		setObject({...object, [e.target.name]: e.target.value})
	}

	const handleSubmit = () => {
		props.onSubmit(object)
	}

	const title = props.name ? `Edit ${props.name}` : 'Create Column'

	return (
		<>
			{
				object && (
					<Dialog 
						title={title}
						onSubmit={handleSubmit}
					>
						<Input
							label="Name"
							name="name"
							value={object.name}
							onChange={handleChange}
							placeholder="column_name"
							helperText="Recommended to use lowercase and use an underscore to separate words e.g. column_name"
						/>

						<Select
							label="Type"
							name="type"
							value={object.type}
							onChange={handleChange}
							helperText="The type of data the column will store"
						>
							<option value="text">Text</option>
							<option value="number">Number</option>
							<option value="boolean">Boolean</option>
							<option value="date">Date</option>
						</Select>

						<Input
							label="Default Value"
							name="default"
							value={object.default
							}
							onChange={handleChange}
							placeholder="NULL"
						/>
						
						<Input
							type="checkbox"
							label="Primary Key"
							name="primary"
							value={object.primary}
							onChange={handleChange}
							disabled
							/>

						<Input	
							type="checkbox"
							label="Auto Increment"
							name="autoIncrement"
							value={object.autoIncrement}
							onChange={handleChange}
							disabled
						/>

						<Input
							type="checkbox"
							label="Not Null"
							name="notNull"
							value={object.notNull}
							onChange={handleChange}
							helperText="If checked, the column cannot be null"
						/>

						<Input
							type="checkbox"
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