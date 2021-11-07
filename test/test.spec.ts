import test from 'ava'
import {
  open,
  OPEN_READWRITE,
} from '../src'


/**
 * in memory based database
 */
test.serial('in memory based database', async t => {
  // open the database
  const db = await open(':memory:')
  console.log('Connected to the in-memory SQlite database.')
  // close the database connection
  await db.close()
  console.log('Close the database connection.')
  t.pass()
})

/**
 * disk file based database
 */
test.serial('disk file based database', async t => {
  // open the database
  const db = await open('./assets/chinook.db', OPEN_READWRITE)
  console.log('Connected to the database.')
  const row = await db.get(`SELECT PlaylistId as id,
                            Name as name
                            FROM playlists`)
  console.log(row.id + '\t' + row.name)
  t.is(row.id, 1)
  t.is(row.name, 'Music')
  await db.close()
  console.log('Close the database connection')
})

/**
 * Querying all rows with all() method
 */
test.serial('Querying all rows with all() method', async t => {
  const sql = `SELECT DISTINCT Name name FROM playlists
               ORDER BY name`
  const db = await open('./assets/chinook.db')
  const rows = await db.all(sql, [])
  rows.forEach(row => {
    console.log(row.name)
  })
  const comparisons = [
    '90’s Music',
    'Audiobooks',
    'Brazilian Music',
    'Classical',
    'Classical 101 - Deep Cuts',
    'Classical 101 - Next Steps',
    'Classical 101 - The Basics',
    'Grunge',
    'Heavy Metal Classic',
    'Movies',
    'Music',
    'Music Videos',
    'On-The-Go 1',
    'TV Shows',
  ]
  t.deepEqual(rows.map(row => row.name), comparisons)
  await db.close()
})

/**
 * Query the first row in the result set
 */
test.serial('Query the first row in the result set', async t => {
  // open the database
  const db = await open('./assets/chinook.db')
  const sql = `SELECT PlaylistID id,
                    Name name
               FROM playlists
               WHERE PlaylistId = ?`
  const playlistId = 1
  // first row only
  const row = await db.get(sql, [playlistId])
  row
  ? console.log(row.id, row.name)
  : console.log(`No playlist found with the id ${playlistId}`)
  t.is(row.id, 1)
  t.is(row.name, 'Music')
  // close the database connection
  await db.close()
})

/**
 * for await ... of
 */
test.serial('for await ... of', async t => {
  const asyncIterable = () => 
  {
    return {
      [Symbol.asyncIterator]() {
        return {
          i: 0,
          next() {
            if(this.i < 3) {
              return Promise.resolve({value: this.i++, done: false})
            }
            return Promise.resolve({value: null, done: true})
          }
        }
      }
    }
  }
  for await (let num of asyncIterable()) {
    console.log(num)
  }
  t.pass()
})

/**
 * Query rows with each() method
 */
test.serial('Query rows with each() method', async t => {
  // open the database
  const db = await open('./assets/chinook.db')
  const sql = `SELECT FirstName firstName,
                    LastName lastName,
                    Email email
               FROM customers
               WHERE Country = ?
               ORDER BY FirstName`
  const rows: string[] = []
  for await (let row of db.each(sql, ['USA'])) {
    const r = `${row.firstName} ${row.lastName} - ${row.email}`
    console.log(r)
    rows.push(r)
  }
  const comparisons = [
    'Dan Miller - dmiller@comcast.com',
    'Frank Harris - fharris@google.com',
    'Frank Ralston - fralston@gmail.com',
    'Heather Leacock - hleacock@gmail.com',
    'Jack Smith - jacksmith@microsoft.com',
    'John Gordon - johngordon22@yahoo.com',
    'Julia Barnett - jubarnett@gmail.com',
    'Kathy Chase - kachase@hotmail.com',
    'Michelle Brooks - michelleb@aol.com',
    'Patrick Gray - patrick.gray@aol.com',
    'Richard Cunningham - ricunningham@hotmail.com',
    'Tim Goyer - tgoyer@apple.com',
    'Victor Stevens - vstevens@yahoo.com',
  ]
  t.deepEqual(rows, comparisons)
  await db.close()
})

/**
 * Insert on row into a table
 */
test.serial('Insert one row into a table', async t => {
  const db = await open(':memory:')
  // insert one row into the langs table
  await db.run('CREATE TABLE langs(name text)')
  const res = await db.run(`INSERT INTO langs(name) VALUES(?)`, ['C'])
  // get the last insert id
  console.log(`A row has been inserted with rowid ${res.lastID}`)
  t.is(res.lastID, 1)
  // close the database connection
  await db.close()
})

/**
 * Insert multiple rows into a table at a time
 */
test.serial('Insert multiple rows into a table at a time', async t => {
  // open the database connection
  const db = await open(':memory:')
  const languages = ['C++', 'Python', 'Java', 'C#', 'Go']
  // construct the insert statement with multiple placehoders
  // based on the number of rows
  const placeholders = languages.map(lan => '(?)').join(',')
  const sql = 'INSERT INTO langs(name) VALUES ' + placeholders
  // output the INSERT statement
  console.log(sql)
  await db.run('CREATE TABLE langs(name text)')
  const res = await db.run(sql, languages)
  console.log(`Rows inserted ${res.changes}`)
  t.is(res.changes, 5)
  // close the database connection
  db.close()
})

/**
 * Updating Data in SQLite Database from a Node.js Application
 */
test.serial('Updating Data in SQLite Database from a Node.js Application', async t => {
  // open the database connection
  const db = await open(':memory:')
  const languages = ['C++', 'Python', 'Java', 'C#', 'Go', 'C']
  // construct the insert statement with multiple placehoders
  // based on the number of rows
  const placeholders = languages.map(lan => '(?)').join(',')
  const sqlInsert = 'INSERT INTO langs(name) VALUES ' + placeholders
  // update statement
  const data = ['Ansi C', 'C']
  const sqlUpdate = `UPDATE langs
                SET name = ?
                WHERE name = ?`
  // create table
  await db.run('CREATE TABLE langs(name text)')
  // insert rows
  const insertRes = await db.run(sqlInsert, languages)
  console.log(`Rows inserted: ${insertRes.changes}`)
  t.is(insertRes.changes, 6)
  // update
  const updateRes = await db.run(sqlUpdate, data)
  console.log(`Row(s) updated: ${updateRes.changes}`)
  t.is(updateRes.changes, 1)
  // close the database connection
  await db.close()
})

/**
 * Deleting Data in SQLite Database from a Node.js Application
 */
test.serial('Deleting Data in SQLite Database from a Node.js Application', async t => {
  // open the database connection
  const db = await open(':memory:')
  const languages = ['C++', 'Python', 'Java', 'C#', 'Go']
  // construct the insert statement with multiple placehoders
  // based on the number of rows
  const placeholders = languages.map(lan => '(?)').join(',')
  const sql = 'INSERT INTO langs(name) VALUES ' + placeholders
  // create table
  await db.run('CREATE TABLE langs(name text)')
  const insertRes = await db.run(sql, languages)
  console.log(`Rows inserted: ${insertRes.changes}`)
  t.is(insertRes.changes, 5)
  const id = 1
  // delete a row based on id
  const deleteRes = await db.run(`DELETE FROM langs WHERE rowid=?`, id)
  console.log(`Row(s) deleted: ${deleteRes.changes}`)
  t.is(deleteRes.changes, 1)
  // close the database connection
  await db.close()
})