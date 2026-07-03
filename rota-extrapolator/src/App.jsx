import { useState, useEffect } from 'react';
import './App.css';
import Papa from 'papaparse';

function createInitialDateRow() {
  const currentDate = new Date();
  const currentDay = currentDate.getDay();
  const initialDateRow = ['', '', '', '', '', '', ''];
  initialDateRow.forEach((date, index) => {
    const dayDifference = (index + 1) - currentDay;
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + dayDifference); 
    initialDateRow[index] = newDate.toLocaleDateString();
  });
  return initialDateRow;
}

function createFutureDateRows() {
  return [];
}
  
export default function App() {
  const [rotaOptions, setRotaOptions] = useState([
    { id: 0, name: 'Main Rota 1', value: 'mainRota1', dutyData: [] }, 
    { id: 1, name: 'Main Rota 2', value: 'mainRota2', dutyData: [] },
    { id: 2, name: 'Main Rota 3', value: 'mainRota3', dutyData: [] },
    { id: 3, name: 'Main Rota 4', value: 'mainRota4', dutyData: [] }
  ]);

  const [dateRow] = useState(createInitialDateRow);
  const [rotaPicked, setRotaPicked] = useState('');
  const [startWeekPicked, setStartWeekPicked] = useState(false);

  function handleRotaChange(newRota) {
    setRotaPicked(newRota);
    getRotaData(newRota);
  }

  async function getRotaData(fileNumber) {
    try {
      const csvText = await fetchCsv(fileNumber);
      const parsed = Papa.parse(csvText);
      const rows = parsed.data;
      
      rows.shift();
      rows.pop();
      
      const newDuties = rows.map((week, index) => {
        const weekNumber = index + 1;
        return [weekNumber, week[2], week[3], week[4], week[5], week[6], week[7], week[8]];
      });

      setRotaOptions(prevOptions => 
        prevOptions.map(option => 
          option.id === Number(fileNumber)
            ? { ...option, dutyData: newDuties }
            : option
        )
      );
    } catch (error) {
      console.error("Error loading rota data:", error);
    }
  }

  async function fetchCsv(fileNumber) {
    const fileToGet = Number(fileNumber) + 1;
    const response = await fetch(`./ayrMasterRota${fileToGet}.csv`);
    const csv = await response.text();
    return csv;
  }

  function handleSelectWeek(rowIndex) {
    // console.log('duty selected', duty);
    console.log('current rota selected', rotaPicked);
    console.log('rowIndex', rowIndex);
    // get the correct week index to set as the new first option

    const selectedDutyData = rotaOptions[rotaPicked].dutyData;

    if (rowIndex <= 0) return [...selectedDutyData]; // If the first week is selected, return the original array
  
    const packageAfter = selectedDutyData.slice(rowIndex); // Items from seventh to the end
    const packageBefore = selectedDutyData.slice(0, rowIndex); // Items from first up to seventh
    const combined = [...packageAfter, ...packageBefore]; // Combine the two packages

    console.log('rotaOptions[rotaPicked].dutyData', rotaOptions[rotaPicked].dutyData);
    console.log('packageAfter', packageAfter);
    console.log('packageBefore', packageBefore);
    console.log('combined', [...packageAfter, ...packageBefore]);
    
    handleSetNewStartingWeek(rowIndex, combined); // Call the function to set the new starting week
    return [...packageAfter, ...packageBefore];
  }

  function handleSetNewStartingWeek(targetIndex, reorderedDuties) {
    setRotaOptions(prevOptions => 
      prevOptions.map(option => {
        // Only modify the currently active rota
        if (option.id === Number(rotaPicked)) {
          return { ...option, dutyData: reorderedDuties };
        }
        return option;
      })
    );
    createFutureDateRows();
    setStartWeekPicked(true); // show the date rows when a week is selected
  }


  return (
    <div>
      <h1>Rota Extrapolator</h1> 
      <div>
        <label htmlFor="rotas">Which rota are you on?:</label>
        <select
          className="rota-select"
          id="rotas"
          name="rotas"
          value={rotaPicked}
          onChange={(e) => handleRotaChange(e.target.value)}
        >
          <option value="" disabled>Select a rota...</option>
          {rotaOptions.map((rota) => (
            <option key={rota.id} value={rota.id}>
              {rota.name}
            </option>
          ))}
        </select>
      </div>
      {rotaPicked !== '' && rotaOptions[rotaPicked]?.dutyData?.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>WEEK</th>
              <th>Monday</th>
              <th>Tuesday</th>
              <th>Wednesday</th>
              <th>Thursday</th>
              <th>Friday</th>
              <th>Saturday</th>
              <th>Sunday</th>
            </tr>
          </thead>
          <tbody>
            {startWeekPicked ? 
            <tr>
              <td></td>
              {dateRow.map((date, index) => <td key={index}>{date}</td>)}
            </tr>
            : null}
            {rotaOptions[rotaPicked].dutyData.map((row, rowIndex) => (
              <tr className="duty-row" key={rowIndex}>
                {row.map((duty, dutyIndex) => (
                  <td key={dutyIndex} onClick={(event) => handleSelectWeek(rowIndex)}>{duty}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        rotaPicked !== '' && <p>Loading table data...</p>
      )}
    </div>
  );
}

