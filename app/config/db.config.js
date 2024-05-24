// ============================================================================
//  Copyright 2023 Northern Pacific Technologies, LLC
// 
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//  
//     http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
// ============================================================================

/*
const mysql = require('mysql2')

const pool = mysql.createPool({
  database: process.env.MYSQL_DATABASE,
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  multipleStatements: true,
  port: Number(process.env.MYSQL_PORT || 3306),
  connectionLimit: Number(process.env.MYSQL_MAX_POOL_SIZE || 100),
})

// TODO: Move to ../utils/db-utils.js
exports.query = (query, values = []) => {
  return new Promise((resolve, reject) => {
    pool.query(query, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    })
  })
}
*/
