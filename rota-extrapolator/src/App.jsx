import React, { useState, useEffect, Fragment } from 'react';
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

  
export default function App() {
  const [rotaOptions, setRotaOptions] = useState([
    { id: 0, name: 'Main Rota 1', value: 'mainRota1', dutyData: [], dateData: [] }, 
    { id: 1, name: 'Main Rota 2', value: 'mainRota2', dutyData: [], dateData: [] },
    { id: 2, name: 'Main Rota 3', value: 'mainRota3', dutyData: [], dateData: [] },
    { id: 3, name: 'Main Rota 4', value: 'mainRota4', dutyData: [], dateData: [] }
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
    // console.log('current rota selected', rotaPicked);
    // console.log('rowIndex', rowIndex);
    // get the correct week index to set as the new first option

    const selectedDutyData = rotaOptions[rotaPicked].dutyData;

    if (rowIndex <= 0) return [...selectedDutyData]; // If the first week is selected, return the original array
  
    const packageAfter = selectedDutyData.slice(rowIndex); // Items from seventh to the end
    const packageBefore = selectedDutyData.slice(0, rowIndex); // Items from first up to seventh
    const combined = [...packageAfter, ...packageBefore]; // Combine the two packages
    
    handleSetNewStartingWeek(rowIndex, combined); // Call the function to set the new starting week
    return [...packageAfter, ...packageBefore];
  }

  function handleSetNewStartingWeek(targetIndex, reorderedDuties) {
    // 1. Calculate the matching date matrix first using the freshly reordered duties length
    const dateArray = reorderedDuties.map((_, index) => {
      if (index === 0) return dateRow; // Week 1 uses base dates
      return getDatesForWeek(index);   // Subsequent weeks increment by 7 days
    });

    // 2. Safely update BOTH dutyData and dateData inside the React state setter
    setRotaOptions(prevOptions => 
      prevOptions.map(option => {
        if (option.id === Number(rotaPicked)) {
          return { 
            ...option, 
            dutyData: reorderedDuties,
            dateData: dateArray // Saves dates cleanly without mutation
          };
        }
        return option;
      })
    );
    
    setStartWeekPicked(true);
  }

  function getDatesForWeek(weeksToAdd) {
    // console.log("weeksToAdd: ", weeksToAdd);
    // console.log("dateRow: ", dateRow);
    return dateRow.map(dateStr => {
      if (!dateStr) return ''; // Skip empty cell or week number placeholder
      
      // Parse the localized date string back into a Date object
      const [day, month, year] = dateStr.split('/');
      const date = new Date(year, month - 1, day);
      
      // Add 7 days multiplied by the number of weeks shifted
      date.setDate(date.getDate() + (weeksToAdd * 7));
      // console.log(`Original date: ${dateStr}, New date after adding ${weeksToAdd} weeks: ${date.toLocaleDateString()}`);
      return date.toLocaleDateString();
    });
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
            {rotaOptions[rotaPicked].dutyData.map((row, rowIndex) => {
              // Safely look up the corresponding date row from our updated state
              const matchingDateRow = rotaOptions[rotaPicked].dateData?.[rowIndex];

              return (
                <React.Fragment key={`week-group-${rowIndex}`}>
                  {/* Render the Date Row ONLY if a start week has been picked and dates exist */}
                  {startWeekPicked && matchingDateRow && (
                    <tr className="date-row" style={{ backgroundColor: '#f0f4f8', fontWeight: 'bold' }}>
                      <td></td>
                      {matchingDateRow.map((date, dateIdx) => (
                        <td key={`date-${dateIdx}`}>{date}</td>
                      ))}
                    </tr>
                  )}

                  {/* The Standard Duty Row */}
                  <tr className="duty-row">
                    {row.map((duty, dutyIndex) => (
                      <td 
                        key={dutyIndex} 
                        onClick={() => handleSelectWeek(rowIndex)}
                        style={{ cursor: 'pointer' }}
                      >
                        {duty}
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
          {/* <tbody>
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
          </tbody> */}
        </table>
      ) : (
        rotaPicked !== '' && <p>Loading table data...</p>
      )}
    </div>
  );
}

