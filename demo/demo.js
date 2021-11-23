import {DataValidator as DV} from '../data-validator.js';

// Create templates for display
const Templates = {
	heading: document.createElement('template'),
	item: document.createElement('template')
};
Templates.heading.innerHTML = `<header></header><span>Structure</span><span>Data</span><span>Result</span>`;
Templates.item.innerHTML = `<pre></pre><pre></pre><pre></pre>`;

const objToString = obj => JSON.stringify(obj, null, 3);

const addHeading = title => {
/**********************
Adds a heading template with the given title
**********************/
	const t = Templates.heading.content.cloneNode(true);
	t.querySelector('header').innerText = title;
	document.body.appendChild(t);
};

const addItems = (struct, ...data) => {
/**********************
Creates a validator for the given structure
**********************/

	let structError = false; // Flag to repersent errors in the structures
	const dv = new DV(struct); // Create a validator for the given structure
	if(dv.hasErrors) { // Check if structure is valid
		structError = `Invalid Structure:\n\n${dv.errorString}`;
	}
	struct = objToString(struct); // Converting structure to a string for later display

	for(let d of data) { // Validate each data
		const t = Templates.item.content.cloneNode(true);
		const pre = t.querySelectorAll('pre');
		pre[0].innerHTML = struct;
		pre[1].innerHTML = objToString(d);
		if(structError === false) {
			const val = dv.validate(d); // Validate data
			if(dv.hasErrors) { // Check if data matches the structure
				pre[2].innerHTML = `Invalid data:\n\n${dv.errorString}`;
			} else {
				pre[2].innerHTML = objToString(val);
			}
		} else {
			pre[2].innerHTML = structError;
		}
		document.body.appendChild(t);
	}
};

export {addHeading, addItems};