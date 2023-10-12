import { useEffect, useState } from 'preact/hooks'

import { db } from '../../api/routes'

import { Button, Dialog, Form, Input, TextArea } from '../../ui/aui'


export default function Tables() {

	const [data, setData] = useState(null)

	useEffect(() => {
		db.getTables().then((res) => {
			setData(res)
			console.log(res)
		})
	}, [])

	const handleCreateTable = async (table) => {
		await db.create('tables', table)
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
					<h6 class="gray">Tables ({data && data.length})</h6>
					<div className="menu-item-list">
						{
							data && data.map((table) => {
								return (
									<div className="menu-item-list-item">
										{table.name}
									</div>
								)
							})
						}
					</div>
				</div>	
			</div>
			<div class="content">
				
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

	return (
		<>
			{
				object && (
					<Dialog 
						title="Create Table"
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

						<div>
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
															name={`columns[${index}].name`}
															value={column.name}
															onChange={handleNestedChange}
														/>
													</td>
													<td>
														<select
															name={`columns[${index}].type`}
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
															name={`columns[${index}].defaultValue`}
															value={column.defaultValue}
															onChange={handleNestedChange}
															disabled={column.primary}
														/>
													</td>
													<td>
														<input
															type="checkbox"
															name={`columns[${index}].primary`}
															checked={column.primary}
															onChange={handleNestedChange}
														/>
													</td>
													<td></td>
													<td>
														<Button
															variant="outlined"
															color="alert"
															size="slim"
															onClick={handleDeleteRow}
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
						</div>

					</Dialog>
				)
			}	
		</>
	)
}