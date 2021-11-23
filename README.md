### ***Readme and examples are under construction. Please check later***

----

# JS Data Validator
A JS module for simplifying complexly-structured-data validation.

----
## Installation:

```javascript
import {DataValidator} from 'https://cdn.jsdelivr.net/gh/anshu-krishna/JS-Data-Validator@1.1/data-validator.min.js';

// OR

const {DataValidator} = await import('https://cdn.jsdelivr.net/gh/anshu-krishna/JS-Data-Validator@1.1/data-validator.min.js');
```

----

## Features:
* Supported types:
	* `bool` : Boolean value
	* `email` : String containing an email address
	* `float` : Float value
	* `hex` : String containing a hex value
	* `int` : Int value
	* `any` : Any value
	* `null` : Null value
	* `number` : Int or Float value
	* `string` : String value
	* `timestamp` : String containing a timestamp.\
					eg: '2021-01-31', '01-Jan-2021', 'January 1, 2021 05:00:10 AM GMT+05:30', etc.
	* `unsigned` : Int >= 0
	* `url` : String containing a URL

* Custom data types can also be added. For example see `demo files`

* Multiple alternative data types can be set for a data item. eg: `'int|float|null'`, `'email|null'`, etc.

* Supported Ranger/Formatter
	* `num_range` : Works with any numeric data. Sets range (min, max) of the value
	* `str_range` : Works with any string data. Sets range (min, max) of the string length
	* `str_lower` : Works with any string data. Transforms the string to lowercase
	* `str_upper` : Works with any string data. Transforms the string to uppercase
	* `str_title` : Works with any string data. Transforms the string to titlecase
	* `to_str` : Works with any data. Transfroms the data to a string.

* Custom ranger/formatter can also be added. For example see `demo files`

* Data-structure can be of nested style (Upto max recursion depth). For example see `demo files`

----

## Basic Example:
```html
<script type="module">
	// Load the DataValidator module;
	import {DataValidator as DV} from 'https://cdn.jsdelivr.net/gh/anshu-krishna/JS-Data-Validator@1.1/data-validator.min.js';
	
	// This is the expected structure
	const structure = {
		name: "string",			// Name is a string
		id: "int|email",		// ID can be an int or email address
		age: "int@num_range(18,45)",	// Age is an int. Age must be in range [18,45]
		"?nums": ["int|float"],		// Nums is optional. Nums is an array contaning int and float items
		
		// Links is optional. Links is an array of 'item' arrays. 'item' has Title and Link property
		"?links": [{
			"title": "string",	// Title is a string
			"link": "url",		// Link is a URL
		}]
	};

	// Create a validator object for the given data-structure
	let dv = new DV(structure);
	if(dv.hasErrors) { // Check for errors in the structure definition
		console.error('Structure has errors:\n', dv.errorString);
	} else {
		// The validator is ready for use
		let validated = dv.validate({
			name: "Test User1",
			id: "12345",
			age: '0b11001',
			nums: [1, 2, 3, 4.5, 6.7, 8],
			links: [{
				title: "Link 1",
				link: "http://site1.com/user/12345"
			}, {
				title: "Link 2",
				link: "http://site2.com/user/12345"
			}]
		});
		if(dv.hasErrors) { // Check if data validation was successful
			console.error('Data doesnot match the structure:\n', dv.errorString);
		} else {
			console.log('Data matches the structure:\n', validated);
		}

		// Next validation
		validated = dv.validate({
			name: "Test User2",
			id: "user2@site2.com",
			age: "30", // Integer value in a string
			// Optional nums not present
			links: [{
				title: "Link 1",
				link: "http://site1.com/user/56789"
			}]
		});
		
		if(dv.hasErrors) { // Check if data validation was successful
			console.error('Data doesnot match the structure:\n', dv.errorString);
		} else {
			console.log('Data matches the structure:\n', validated);
		}

		// Lets do some more validations
		validated = dv.validate({id: 78912, age: 70}); // Some missing data. Age is out of range.

		if(dv.hasErrors) { // Check if data validation was successful
			console.error('Data doesnot match the structure:\n', dv.errorString);
		} else {
			console.log('Data matches the structure:\n', validated);
		}

		// Last example
		validated = dv.validate({
			name: true, // Bool insteadof a string
			age: 80,
			nums: [1, false, 20, 'hello']
			// Optional links not present
		});

		if(dv.hasErrors) { // Check if data validation was successful
			console.error('Data doesnot match the structure:\n', dv.errorString);
		} else {
			console.log('Data matches the structure:\n', validated);
		}
	}
</script>
```