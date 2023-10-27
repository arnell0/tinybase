import { useEffect, useState } from 'preact/hooks'
import { Button } from '../aui'

import './styles.css'
import '../aui.css'

const icons_expand = <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="sbui-icon "><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
const icons_plus = <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="sbui-icon"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>

function SearchBox(props) {
	const { values, setValues } = props

	const [search, setSearch] = useState('')
	const [resultLength, setResultLength] = useState(values.length)

	const handleSearch = (e) => {
		const newSearch = e.target.value
		setSearch(newSearch)

		let _values = [...values] 

		if (newSearch !== '') {
			_values = _values.filter(row => row.some(value => value.toString().toLowerCase().includes(newSearch.toLowerCase())))
		}

		setValues(_values)
		setResultLength(_values.length)
	}

	return (
		<div 
			class='just-search-box'
			style={{
				display: 'flex',
				justifyContent: 'flex-start',
				alignItems: 'center',
				gap: '5px',
			}
		}>
			<input
				type="text"
				placeholder='Search...'
				value={search}
				onInput={handleSearch}
				style={{
					padding: '8px',
					border: '1px solid #ccc',
				}}
			/>
			<span> {resultLength} results</span>
		</div>
	)
}


function Table(props) {
	const [settings, setSettings] = useState({
		fullWidth: true, // if true, table will take 100% width of parent container
		autoGenerateColumns: true, // if true, columns will be generated from data keys, if false, columns must be provided (camel case, underscore, dash)
		pagination: true, // if true, pagination will be enabled
		paginationSize: 10, // number of rows per page
		search: true, // if true, search will be enabled (search by all columns)
		stickyHeader: true, // if true, header will be sticky
		stickyFooter: true, // if true, footer will be sticky
		onRowClick: (row) => {}, // function to be called when row is expanded
		onColumnClick: (column) => {}, // function to be called when column is expanded
		onColumnCreate: () => {}, // function to be called when column is created
	})

	const [columns, setColumns] = useState([])
	const [baseValues, setBaseValues] = useState([])
	const [values, setValues] = useState([])
	const [page, setPage] = useState(1)
	const [pages, setPages] = useState(1)
	const [sortBy, setSortBy] = useState({
		column: '',
		order: 'desc',
	})

	const extractBaseValues = (data) => {
		return data.map(item => Object.values(item).map(value => {
			if (Array.isArray(value)) {
				return JSON.stringify(value)
			}
			return value
		}))
	}

	// handle pagination size change affected by search 
	useEffect(() => {
		const newPages = Math.ceil(baseValues.length / settings.paginationSize)
		setPages(newPages)
	}, [baseValues])

	useEffect(() => {
		const { data } = props  

		if (data === undefined || data.length === 0) {
			throw new Error('Data must be provided')
		}

		// handle settings
		const _settings = {}
		Object.keys(settings).forEach(key => {
			if (props[key] !== undefined) {
				_settings[key] = props[key]
			} else {
				_settings[key] = settings[key]
			}
		})

		setSettings(_settings)

		// handle columns
		let _columns = []
		if (_settings.autoGenerateColumns === true && props.columns.length === 0) {
		_columns = Object.keys(data[0])

		// split by underscore, camel case, dash and capitalize first letter of each word
		_columns.forEach((column, index) => {
			_columns[index] = column.split('_').join(' ') // replace underscore with space
			.replace(/([A-Z])/g, ' $1') // split by capital letter
			.split('-').join(' ') // replace dash with space
			.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') // capitalize first letter of each word
			})
		} else {
			if (props.columns === undefined || props.columns.length === 0) {
				throw new Error('Columns must be provided')
			} 
			_columns = props.columns
		}
		setColumns(_columns)

		// handle values
		let _values = extractBaseValues(data)

		setBaseValues([..._values])

		// handle pagination
		if (_settings.pagination === true) {
			_values = _values.slice((page - 1) * _settings.paginationSize, page * _settings.paginationSize)
		}

		setValues(_values)
	}, [props])

	const handleColumnClick = (column) => {
		settings.onColumnClick(column)
	}

	const handleColumnCreate = () => {
		settings.onColumnCreate()
	}

	const Thead = () => {
		return (
			<thead style={{
				position: settings.stickyHeader === true ? 'sticky' : 'relative',
			}}>
				<tr>
					<th>
						<div>
							<input type="checkbox" name="" id="" />
						</div>
					</th>
					{columns.length > 0 && columns.map((column, index) => (
						<th key={index}>
							<div>
								<div>
									<div onClick={() => handleSort(column)}>
										{column} &nbsp;
									</div>
									{
										sortBy.column === column && (
											<div>
												{sortBy.order === 'asc' ? '↑' : '↓'} 
											</div>
										)
									}
								</div>

								<div class="icon expand" onClick={() => handleColumnClick(column)}>{icons_expand}</div>
							</div>
						</th>
					))}
					<th>
						<div style={{
							justifyContent: 'center',
						}}>
							<div class="icon expand" onClick={handleColumnCreate}>{icons_plus}</div>
						</div>
					</th>
				</tr>
			</thead>
		)
	}

	const handleRowClick = (row) => {
		// find row in baseValues
		const baseIndex = baseValues.findIndex(baseRow => baseRow === row)

		if (baseIndex === -1) {
			return
		}

		const dataRow = props.data[baseIndex]
		props.onRowClick(dataRow)
	}

	const handleRowCreate = () => {
		props.onRowCreate()
	}

	const Tbody = () => {
		return (
			<tbody >
				{values.length > 0 && values.map((row, index) => (
					<tr key={index}>
						<td>
							<input type="checkbox" name="" id="" />
							<div class="icon expand" onClick={() =>- handleRowClick(row)}>{icons_expand}</div>
						</td>
						
						{row.map((value, index) => (
							<td key={index}>{value}</td>
						))}

						<td>
							
						</td>
					</tr>
				))}

				<tr>
					<td>
						<div style={{
							margin: '0 auto',
						}}>
							<div class="icon expand" onClick={handleRowCreate}>{icons_plus}</div>
						</div>
					</td>

					{columns.length > 0 && columns.map((column, index) => (
						<td key={index}>
							
						</td>
					))}
				</tr>
			</tbody>
		)
	}

	const handlePagination = (newPage, _values, newPaginationSize) => {
		let paginationSize = settings.paginationSize

		if (newPaginationSize !== undefined) {
			paginationSize = newPaginationSize
		}

		_values = _values.slice((newPage - 1) * paginationSize, newPage * paginationSize)

		setPage(newPage)
		setValues(_values)
	}

	const Pagination = () => {
		const { pagination } = settings

		if (pagination === false) {
		return null
		}

		const handlePageChange = (newPage) => {
		handlePagination(newPage, [...baseValues])
		}

		const handleRowsPerPageChange = (newPaginationSize) => {
		const newPages = Math.ceil(baseValues.length / newPaginationSize)
		setPages(newPages)

		const newSettings = {...settings}
		newSettings.paginationSize = newPaginationSize
		setSettings(newSettings)

		handlePagination(1, [...baseValues], newPaginationSize  )
		}

		return (
			<tfoot style={{
				position: settings.stickyFooter === true ? 'sticky' : 'relative',
				bottom: "-1px",
			}}>
				<tr>
					<td colSpan={columns.length + 1}>
						<div 
							style={{
							display: 'flex',
							justifyContent: 'flex-end',
							alignItems: 'center',
							gap: '5px',
							}}
						>
							<span>Rows per page: </span>
							<select
								onChange={(e) => handleRowsPerPageChange(e.target.value)}
								value={settings.paginationSize}
							>
							{[5, 10, 20, 50, 100].map((value, index) => (
								<option key={index} value={value}>{value}</option>
							))}
							</select>

							<span>{page}/{pages} </span>
							<button onClick={() => handlePageChange(1)} disabled={page === 1}>{"<<"}</button>
							<button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>{"<"}</button>
							<button onClick={() => handlePageChange(page + 1)} disabled={page === pages}>{">"}</button>
							<button onClick={() => handlePageChange(pages)} disabled={page === pages}>{">>"}</button>
						</div>
					</td>
				</tr>
			</tfoot>
		)
	}

	const handleSearch = (newValues) => {
		handlePagination(1, newValues)
		setBaseValues(newValues)
	}

	const handleSort = (column) => {
		let _baseValues = [...baseValues]
		let _sortBy = {...sortBy}

		if (column === sortBy.column) {
			_sortBy.order = sortBy.order === 'asc' ? 'desc' : 'asc'
		} else {
			_sortBy.column = column
			_sortBy.order = 'asc'
		}

		setSortBy(_sortBy)

		const columnIndex = columns.indexOf(column)
		_baseValues.sort((a, b) => {
			if (a[columnIndex] < b[columnIndex]) {
				return _sortBy.order === 'asc' ? -1 : 1
			}
			if (a[columnIndex] > b[columnIndex]) {
				return _sortBy.order === 'asc' ? 1 : -1
			}
			return 0
		})

		handlePagination(1, _baseValues)
		setBaseValues(_baseValues)
	}

	const Search = (
		<thead>
			{
				settings.search === true && 
				<tr>
					<td colSpan={columns.length + 1}>
						<div style={{
							display: 'flex',
							alignItems: 'center',
							gap: '20px',
						}}>
							<SearchBox values={extractBaseValues(props.data)} setValues={handleSearch} />
							<Button 
								variant='contained'
								color='success'
								onClick={handleRowCreate}
								size='slim'
							>
								Insert row
							</Button>
						</div>
					</td>
				</tr> 
			}
		</thead>
	)

	return (
		<div class='just-wrapper'>
			<table 
				class='just-table'
				style={{
				width: settings.fullWidth ? '100%' : 'auto',
			}}
			>
				{Search}
				<Thead />
				<Tbody />
				<Pagination />
			</table>  
		</div>
	)
}

export default Table
