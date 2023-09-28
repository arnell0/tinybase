import { useEffect, useState } from 'preact/hooks'

import { db } from '../../api/routes'

import { Button } from '../../ui/aui'


export default function Tables() {

	const [data, setData] = useState(null)
	const 

	useEffect(() => {
		db.getTables().then((res) => {
			setData(res)
			console.log(res)
		})
	}, [])

	return (
		<div class="frame">
			<div class="menu">
				<div class="menu-title">
					<h4>Table Editor</h4>
				</div>
				<div class="menu-item">
					<Button variant="contained" size="slim" fullWidth>Create Table</Button>
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
				hej
			</div>
		</div>
	)
}
