// defind a variable "db" to refer to the "budget" database in global scope
let db;
// creates a new indexedDB, name budget, version 1
const request = window.indexedDB.open("budget", 1);

// create schema
// use destrure for the event argument
request.onupgradeneeded = function(event) {
    // assign the indexedDB "budget" to the global variable "db"
    const db = event.target.result;
    // creats an object store named "budgetPending", and set autoincrement to be true
    db.createObjectStore("budgetPending", {autoIncrement: true});
};

request.onsuccess = function(event) {
    db = event.target.result;

    // check if the App is online before reading from db
    if(navigator.onLine) {
        checkDatabase();
    }
};

// handle error
request.onerror = event => {
    console.log(event.target.errorCode)
}

// creates a function "saveRecord" to handle saving record
// the function will be call be by sendTransaction funtion in index.js file when html post to database failed.
function saveRecord(record) {
    // open a transaction on budgetPending object store
    // transaction method has two parameters. 1st is an array of object stores that we can do with, 2nd is access ability to the stores, such as"readwrite"
    const transaction = db.transaction(["budgetPending"], "readwrite");
    // get access the budgetPending object store
    const store = transaction.objectStore("budgetPending");

    // add record to the budgetPending object store
    store.add(record);
}

// look at the indexedDB budget database to see if there is any pending transactions
function checkDatabase() {
    // open a transaction on budgetPending object store
    const transaction = db.transaction(["budgetPending"], "readwrite");
    // get access the budgetPending object store
    const store = transaction.objectStore("budgetPending");
    // get all records from store and assign to a variable "getAll"
    const getAll = store.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*", 
                    "Content-Type": "application/json"
                }
            })
            .then(res => res.json())
            .then( () => {
                // if successful, open a transaction on the budgetPending store
                const transaction = db.transaction(["budgetPending"], "readwrite")
                // accress the pending object store
                const store = transaction.objectStore("budgetPending");

                // clear the object store
                store.clear();
            });
        }

    };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);