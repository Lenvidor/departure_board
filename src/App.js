import React from 'react';
import './App.css';

import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css'

class Clock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {date: new Date()};
  }

  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      1000
    );
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  tick() {
    this.setState({
      date: new Date()
    });
  }

  render() {
    return (
      <div>
        <h1>SOUTH STATION DEPARTURE BOARD</h1>
        <h2> {this.state.date.toLocaleString()}</h2>
      </div>
    );
  }
}

function parseData(response) {
	if (response.data.length <= 0) {
		return [];
	}
	
	let result = [];
	let includedMap = response.included.reduce((obj, x) => { obj[x.id] = x; return obj }, {});
	// Arrival, Departure, To, From, Train#, Track#, Status
	for (let rowData of response.data) {
		let innerResult = {};
		let schedule = includedMap[rowData.relationships.schedule.data.id];
		let route = includedMap[rowData.relationships.route.data.id];
		let stop = includedMap[rowData.relationships.stop.data.id];
		let trip = includedMap[rowData.relationships.trip.data.id];
		
		innerResult.rawArrival = schedule.attributes.arrival_time;
		innerResult.arrival = innerResult.rawArrival ? (new Date(innerResult.rawArrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})) : " - -: - - ";
		
		innerResult.rawDeparture = schedule.attributes.departure_time;
		innerResult.departure = innerResult.rawDeparture ? (new Date(innerResult.rawDeparture).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})) : " - - : - - ";
		
		innerResult.status = rowData.attributes.status;
		innerResult.to = route.attributes.direction_destinations[schedule.attributes.direction_id];
		innerResult.from = route.attributes.direction_destinations[(schedule.attributes.direction_id + 1) % 2];
		innerResult.track_number = stop.attributes.platform_code;
		innerResult.train_number = trip.attributes.name;
		
		result.push(innerResult);
	}
	result.sort((a, b) => {
		let aTime = a.rawArrival || a.rawDeparture;
		let bTime = b.rawArrival || b.rawDeparture;
		
		return aTime !== bTime ? new Date(aTime) > new Date(bTime) ? 1 : -1 : 0;
	});
	return result;
}

class TableExample extends React.Component {
	constructor(props) {
		super(props)
		
		this.state = { model: [] }
	}
	
	tick() {
		this.request = new XMLHttpRequest();
		this.request.onload = () => {
			let response = JSON.parse(this.request.response);
			this.setState({ model: parseData(response)});
		}
		// request data for South Station
		this.request.open("GET", "https://api-v3.mbta.com/predictions?include=trip,stop,schedule,route&filter%5Bstop%5D=place-sstat&filter[route_type]=2&fields[prediction]=arrival_time,departure_time,status", true);
		this.request.send();
	}
	
	
	componentDidMount() {
		this.tick();
		this.timerID = setInterval(
		  () => this.tick(),
		  15000
		);
	}

	componentWillUnmount() {
		clearInterval(this.timerID);
	}
	
	render() {
		return (
			<Table>
			  <Thead>
				<Tr>
				  <Th>Arrival</Th>
				  <Th>Departure</Th>
				  <Th>From</Th>
				  <Th>To</Th>
				  <Th>Train#</Th>
				  <Th>Track#</Th>
				  <Th>Status</Th>
				</Tr>
			  </Thead>
			  <Tbody>
			    {this.state.model.map( rowData => {
					return <Tr>
						     <Td>{rowData.arrival}</Td>
						     <Td>{rowData.departure}</Td>
						     <Td>{rowData.from}</Td>
						     <Td>{rowData.to}</Td>
						     <Td>{rowData.train_number}</Td>
						     <Td>{rowData.track_number}</Td>
						     <Td>{rowData.status}</Td>
						   </Tr>
				})}
			  </Tbody>
			</Table>
		  )
	}
}

function App() {
  return (
    <div>
      <Clock />
      <TableExample />
    </div>
  );
}

export default App;
