import { useEffect, useState } from 'preact/hooks'

import { db } from '../../api/routes'

import { Button, Dialog } from '../../ui/aui'


export default function Tables() {

	const [data, setData] = useState(null)

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
					<Dialog
						title="Create Table"
						buttonText="Create Table"
					>					
						
					</Dialog>
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
