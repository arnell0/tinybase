
// MiniBase
// A tiny, simple, and fast one file backend written in Rust.
// Author: @Arnell0

use axum::{
    extract::State,
    routing::{get, post, get_service},
    http::StatusCode,
    response::IntoResponse,
    Json, Router,
    middleware::{self, Next},
};

use axum::extract::Path;
use axum_extra::extract::Query;
// use tower_http::services::ServeFile;

use std::{io};
use std::net::SocketAddr;
use std::collections::HashMap;
use std::sync::Arc;
use std::any::{Any, TypeId};

use serde::{Deserialize, Serialize};
use serde_json::{json};

use rusqlite::{Connection, Result};

use jwt_simple::prelude::*;

use std::fs::File;
use std::io::Write;


use axum::http::{Request, Response, Method, header};
use tower::{ServiceBuilder, ServiceExt, Service};
use std::convert::Infallible;

use tower_http::cors::CorsLayer;
use tower_http::cors::Any as CorsAny;
use tower_http::cors::Cors;


use argon2::{
    password_hash::{
        rand_core::OsRng,
        PasswordHash, PasswordHasher, PasswordVerifier, SaltString
    },
    Argon2
};

struct AppState {
    key: HS256Key,
}

fn create_file_if_not_exists(filename: &str) {
    use std::path::Path;
    let path = Path::new(filename);
    if !path.exists() {
        match std::fs::File::create(path) {
            Ok(_) => println!("Created file"),
            Err(e) => println!("Error creating file: {}", e),
        }
    }
}

fn create_direrctory_if_not_exists(directory: &str) {
    use std::path::Path;
    let path = Path::new(directory);
    if !path.exists() {
        match std::fs::create_dir(path) {
            Ok(_) => println!("Created directory"),
            Err(e) => println!("Error creating directory: {}", e),
        }
    }
}

// structs
#[derive(Serialize, Deserialize)]
struct Model {
    id: i64,
    name: String,
    description: String,
    columns: String,
    types: String,
    options: String,
}

// ALTER TABLE SCHEMA
// ADD COLUMN
fn db_alter_table_add_column(table: &str, column: &str, datatype: &str, options: &str) -> Result<()> {
    let connection = match db_open_connection("db.sqlite") {
        Ok(connection) => connection,
        Err(e) => {
            println!("Error opening database: {}", e);
            return Err(e);
        }
    };

    let mut query = String::new();
    query.push_str(&format!("ALTER TABLE {} ADD COLUMN {} {} {}", table, column, datatype, options));

    match connection.execute(
        &query,
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Added column"),
        Err(e) => {
            println!("Error adding column: {}", e);
            return Err(e);
        },
    }

    // update model in models table
    let model = match db_fetch_model(table) {
        Ok(model) => model,
        Err(e) => {
            println!("Error fetching model: {}", e);
            return Err(e);
        }
    };

    let mut model_columns: Vec<&str> = model.columns.split(",").collect();
    let mut model_types: Vec<&str> = model.types.split(",").collect();
    let mut model_options: Vec<&str> = model.options.split(",").collect();

    model_columns.push(column);
    model_types.push(datatype);
    model_options.push(options);

    let model_columns = model_columns.join(",");
    let model_types = model_types.join(",");
    let model_options = model_options.join(",");

    match connection.execute(
        &format!("UPDATE models SET columns = '{}', types = '{}', options = '{}' WHERE name = '{}'", model_columns, model_types, model_options, table),
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Updated model in models table"),
        Err(e) => {
            println!("Error updating model in models table: {}", e);
            return Err(e);
        },
    }

    Ok(())
}

// RENAME COLUMN
fn db_alter_table_rename_column(table: &str, column: &str, new_column: &str) -> Result<()> {
    let connection = match db_open_connection("db.sqlite") {
        Ok(connection) => connection,
        Err(e) => {
            println!("Error opening database: {}", e);
            return Err(e);
        }
    };

    let mut query = String::new();
    query.push_str(&format!("ALTER TABLE {} RENAME COLUMN {} TO {}", table, column, new_column));

    match connection.execute(
        &query,
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Renamed column"),
        Err(e) =>{
            println!("Error renaming column: {}", e);
            return Err(e);
        },
    }

    // update model in models table
    let model = match db_fetch_model(table) {
        Ok(model) => model,
        Err(e) => {
            println!("Error fetching model: {}", e);
            return Err(e);
        }
    };

    let mut columns: Vec<&str> = model.columns.split(",").collect();

    for i in 0..columns.len() {
        if columns[i] == column {
            columns[i] = new_column;
        }
    }

    let columns = columns.join(",");

    match connection.execute(
        &format!("UPDATE models SET columns = '{}' WHERE name = '{}'", columns, table),
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Updated model in models table"),
        Err(e) => {
            println!("Error updating model in models table: {}", e);
            return Err(e);
        },
    }

    Ok(())
}

// UPDATE COLUMN
fn db_alter_table_update_column(table: &str, column: &str, datatype: &str, options: &str) -> Result<()> {
    let connection = match db_open_connection("db.sqlite") {
        Ok(connection) => connection,
        Err(e) => {
            println!("Error opening database: {}", e);
            return Err(e);
        }
    };

    // drop any existing temporary table
    let mut query = String::new();
    query.push_str(&format!("DROP TABLE IF EXISTS {}_temp", table));

    match connection.execute(
        &query,
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Dropped temporary table"),
        Err(e) => {
            println!("Error dropping temporary table: {}", e);
            return Err(e);
        },
    }

    // create temporary table
    let mut query = String::new();

    query.push_str(&format!("CREATE TABLE IF NOT EXISTS {}_temp (", table));

    // fetch existing model
    let model = match db_fetch_model(table) {
        Ok(model) => model,
        Err(e) => {
            println!("Error fetching model: {}", e);
            return Err(e);
        }
    };

    let mut model_columns: Vec<&str> = model.columns.split(",").collect();
    let mut model_types: Vec<&str> = model.types.split(",").collect();
    let mut model_options: Vec<&str> = model.options.split(",").collect();

    // remove column from model_columns, model_types, model_options
    let mut index = 0;
    for i in 0..model_columns.len() {
        if model_columns[i].eq(column) {
            println!("Found column");
            index = i;
        }
    }

    model_columns.remove(index);
    model_types.remove(index);
    model_options.remove(index);

    // add column to model_columns, model_types, model_options
    model_columns.push(column);
    model_types.push(datatype);
    model_options.push(options);
    
    // add existing columns to temporary table
    for i in 0..model_columns.len() {
        query.push_str(&format!("{} ", model_columns[i]));
        query.push_str(&format!("{} {}", model_types[i], model_options[i]));
        if i < model_columns.len() - 1 {
            query.push_str(", ");
        }
    }
    
    query.push_str(")");

    println!("{}", query);

    match connection.execute(
        &query,
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Created temporary table"),
        Err(e) => {
            println!("Error creating temporary table: {}", e);
            return Err(e);
        },
    }

    // copy data from table to temporary table
    let mut query = String::new();
    query.push_str(&format!("INSERT INTO {}_temp SELECT * FROM {}", table, table));

    match connection.execute(
        &query,
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Copied data to temporary table"),
        Err(e) => {
            println!("Error copying data to temporary table: {}", e);
            return Err(e);
        },
    }

    // drop table
    let mut query = String::new();
    query.push_str(&format!("DROP TABLE {}", table));

    match connection.execute(
        &query,
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Dropped table"),
        Err(e) => {
            println!("Error dropping table: {}", e);
            return Err(e);
        },
    }

    // rename temporary table to table
    let mut query = String::new();
    query.push_str(&format!("ALTER TABLE {}_temp RENAME TO {}", table, table));

    match connection.execute(
        &query,
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Renamed temporary table to table"),
        Err(e) => {
            println!("Error renaming temporary table to table: {}", e);
            return Err(e);
        },
    }

    // update model in models table
    let model_columns = model_columns.join(",");
    let model_types = model_types.join(",");
    let model_options = model_options.join(",");

    match connection.execute(
        &format!("UPDATE models SET columns = '{}', types = '{}', options = '{}' WHERE name = '{}'", model_columns, model_types, model_options, table),
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Updated model in models table"),
        Err(e) => {
            println!("Error updating model in models table: {}", e);
            return Err(e);
        },
    }

    Ok(())
}

// DROP COLUMN
fn db_alter_table_drop_column(table: &str, column: &str) -> Result<()> {
    let connection = match db_open_connection("db.sqlite") {
        Ok(connection) => connection,
        Err(e) => {
            println!("Error opening database: {}", e);
            return Err(e);
        }
    };

    let mut query = String::new();
    query.push_str(&format!("ALTER TABLE {} DROP COLUMN {}", table, column));

    match connection.execute(
        &query,
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Dropped column"),
        Err(e) => println!("Error dropping column: {}", e),
    }

    // update model in models table
    let model = match db_fetch_model(table) {
        Ok(model) => model,
        Err(e) => {
            println!("Error fetching model: {}", e);
            return Err(e);
        }
    };

    let mut columns: Vec<&str> = model.columns.split(",").collect();
    let mut types: Vec<&str> = model.types.split(",").collect();
    let mut options: Vec<&str> = model.options.split(",").collect();

    let mut index = 0;
    for i in 0..columns.len() {
        if columns[i] == column {
            index = i;
        }
    }

    columns.remove(index);
    types.remove(index);
    options.remove(index);

    let columns = columns.join(",");
    let types = types.join(",");
    let options = options.join(",");

    match connection.execute(
        &format!("UPDATE models SET columns = '{}', types = '{}', options = '{}' WHERE name = '{}'", columns, types, options, table),
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Updated model in models table"),
        Err(e) => {
            println!("Error updating model in models table: {}", e);
            return Err(e);
        },
    }

    Ok(())
}


// ALTER TABLE SCHEMA
// RENAME TABLE
fn db_alter_table_rename(table: &str, new_name: &str, description: &str) -> Result<()> {
    let connection = match db_open_connection("db.sqlite") {
        Ok(connection) => connection,
        Err(e) => {
            println!("Error opening database: {}", e);
            return Err(e);
        }
    };
    
    let mut query = String::new();
    query.push_str(&format!("ALTER TABLE {} RENAME TO {}", table, new_name));

    match connection.execute(
        &query,
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Renamed table"),
        Err(e) => println!("Error renaming table: {}", e),
    }

    // update model in models table
    let model = match db_fetch_model(table) {
        Ok(model) => model,
        Err(e) => {
            println!("Error fetching model: {}", e);
            return Err(e);
        }
    };

    // if description is empty, don't update description
    let description = if description == "" {
        model.description
    } else {
        description.to_string()
    };

    match connection.execute(
        &format!("UPDATE models SET name = '{}', description = '{}' WHERE name = '{}'", new_name, description, table),
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Updated model in models table"),
        Err(e) => {
            println!("Error updating model in models table: {}", e);
            return Err(e);
        },
    }

    Ok(())
}

// UPDATE TABLE
fn db_alter_table_drop(table: &str) -> Result<()> {
    let connection = match db_open_connection("db.sqlite") {
        Ok(connection) => connection,
        Err(e) => {
            println!("Error opening database: {}", e);
            return Err(e);
        }
    };
    
    let mut query = String::new();
    query.push_str(&format!("DROP TABLE {}", table));

    match connection.execute(
        &query,
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Dropped table"),
        Err(e) => println!("Error dropping table: {}", e),
    }

    // delete model from models table
    match connection.execute(
        &format!("DELETE FROM models WHERE name = '{}'", table),
        (), // empty list of parameters.
    ) {
        Ok(_) => println!("Deleted model from models table"),
        Err(e) => {
            println!("Error deleting model from models table: {}", e);
            return Err(e);
        },
    }

    Ok(())
}



fn db_fetch_model(name: &str) -> Result<Model> {
    let connection = match db_open_connection("db.sqlite") {
        Ok(connection) => connection,
        Err(e) => {
            println!("Error opening database: {}", e);
            return Err(e);
        }
    };

    // check if table exists in models table
    let mut stmt = match connection.prepare(&format!("SELECT * FROM models WHERE name = '{}'", name)) {
        Ok(stmt) => stmt,
        Err(e) => {
            println!("Error preparing statement: {}", e);
            return Err(e);
        }
    };

    let mut rows = match stmt.query([]) {
        Ok(rows) => rows,
        Err(e) => {
            println!("Error querying statement: {}", e);
            return Err(e);
        }
    };  

    while let Some(row) = rows.next().unwrap() {
        let id: i64 = row.get("id").unwrap();
        let name: String = row.get("name").unwrap();
        let description: String = row.get("description").unwrap();
        let columns: String = row.get("columns").unwrap();
        let types: String = row.get("types").unwrap();
        let options: String = row.get("options").unwrap();

        let model = Model {
            id: id,
            name: name,
            description: description,
            columns: columns,
            types: types,
            options: options,
        };
        return Ok(model);
    }

    Err(rusqlite::Error::QueryReturnedNoRows)
}

fn db_create_table(name: &str, description: &str, columns: &str, types: &str, options: &str) -> Result<()> {
    let connection = match db_open_connection("db.sqlite") {
        Ok(connection) => connection,
        Err(e) => {
            println!("Error opening database: {}", e);
            return Err(e);
        }
    };

    let mut query = String::new();
    query.push_str(&format!("CREATE TABLE IF NOT EXISTS {} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,        
    ", name));

    let mut _columns: Vec<&str> = columns.split(",").collect();
    let mut _types: Vec<&str> = types.split(",").collect();
    let mut _options: Vec<&str> = options.split(",").collect();
    
    for i in 0.._columns.len() {
        if i > 0 {
            query.push_str(", ");
        }
        query.push_str(&format!("{} {} {}", _columns[i], _types[i], _options[i]));
    }
    query.push_str(")");

    match connection.execute(
        &query,
        (), 
    ) {
        Ok(_) => println!("Created table"),
        Err(e) => println!("Error creating table: {}", e),
    }

    // check if table exists in models table
    let exist = match db_fetch_model(name) {
        Ok(model) => {
            println!("Model exists");
            true
        },
        Err(e) => false,
    };

    if exist == false {
        // insert new table as model into models table if it doesn't exist
        println!("Table doesn't exist");
        
        // push base columns
        _columns.insert(0, "id");
        _types.insert(0, "INTEGER");
        _options.insert(0, "PRIMARY KEY AUTOINCREMENT");

        _columns.insert(1, "created_at");
        _types.insert(1, "DATETIME");
        _options.insert(1, "DEFAULT CURRENT_TIMESTAMP");

        _columns.insert(2, "updated_at");
        _types.insert(2, "DATETIME");
        _options.insert(2, "DEFAULT CURRENT_TIMESTAMP");

        let columns = _columns.join(",");
        let types = _types.join(",");
        let options = _options.join(",");

        match connection.execute(
            &format!("INSERT INTO models (name, description, columns, types, options) VALUES ('{}', '{}', '{}', '{}', '{}')", name, description, columns, types, options),
            (), // empty list of parameters.
        ) {
            Ok(_) => println!("Inserted table into models table"),
            Err(e) => println!("Error inserting table into models table: {}", e),
        }
    }

    Ok(())
}

fn db_open_connection(database: &str) -> Result<Connection> {
    // create database directory if it doesn't exist
    create_direrctory_if_not_exists("db");
    
    let database = format!("db/{}", database);

    // create database file if it doesn't exist
    create_file_if_not_exists(&database);

    // create connection to database
    let conn = match Connection::open(database) {
        Ok(conn) => conn,
        Err(e) => {
            println!("Error opening database: {}", e);
            return Err(e);
        }
    };
    Ok(conn)
}

fn handle_defaults(connection: &Connection) -> Result<()> {
    // create log file if it doesn't exist
    create_file_if_not_exists("index.log");

    match db_create_table("models", "Models table", "name,description,columns,types,options", "TEXT,TEXT,TEXT,TEXT,TEXT", "UNIQUE,,,,") {
        Ok(_) => println!("Created models table"),
        Err(e) => println!("Error creating models table: {}", e),
    }
    
    match db_create_table("users", "Users table", "username,password,email,role,apx", "TEXT,TEXT,TEXT,TEXT,TEXT", "NOT NULL,NOT NULL,NOT NULL,NOT NULL,NOT NULL") {
        Ok(_) => println!("Created users table"),
        Err(e) => println!("Error creating users table: {}", e),
    }

    // add superuser if it doesn't exist, prompt for password
    let mut stmt = match connection.prepare("SELECT COUNT(*) FROM users WHERE username = 'superuser'") {
        Ok(stmt) => stmt,
        Err(e) => {
            println!("Error preparing statement: {}", e);
            return Err(e);
        }
    };

    let mut rows = match stmt.query([]) {
        Ok(rows) => rows,
        Err(e) => {
            println!("Error querying statement: {}", e);
            return Err(e);
        }
    };

    let row = match rows.next() {
        Ok(row) => row,
        Err(e) => {
            println!("Error getting row: {}", e);
            return Err(e);
        }
    };

    let count: i64 = match row.expect("No row returned").get(0) {
        Ok(count) => count,
        Err(e) => {
            println!("Error getting count: {}", e);
            return Err(e);
        }
    };

    if count == 0 {
        println!("No superuser found, creating superuser");
        println!("Enter password for superuser:");
        let mut password = String::new();

        // todo hide password input
        match std::io::stdin().read_line(&mut password) {
            Ok(_) => (),
            Err(e) => {
                println!("Error reading password: {}", e);
                return Err(rusqlite::Error::QueryReturnedNoRows);
            }
        }

        let password = password.trim();

        let hashed_password = match password_hash(&password) {
            Ok(hashed_password) => hashed_password,
            Err(e) => {
                println!("Error hashing password: {}", e);
                return Err(rusqlite::Error::QueryReturnedNoRows);
            }
        };

        match connection.execute(
            "INSERT INTO users (username, password, email, role, apx) VALUES ('superuser', ?, 'superuser@localhost', 'superuser', 'superuser')",
            &[&hashed_password],
        ) {
            Ok(_) => println!("Created superuser"),
            Err(e) => println!("Error creating superuser: {}", e),
        }
    }

    Ok(())
}



fn db_select(table: &str, _where: &str) -> Result<Vec<serde_json::Value>> {
    // open connection to database
    let connection = match db_open_connection("db.sqlite") {
        Ok(connection) => connection,
        Err(e) => {
            println!("Error opening database: {}", e);
            return Err(e);
        }
    };

    // fetch all columns
    let columns = "*";

    let mut _where = _where.trim();
    
    if _where == "" {
        _where = "1 = 1";
    }

    let mut stmt = match connection.prepare(&format!("SELECT {} FROM {} WHERE {}", columns, table, _where)) {
        Ok(stmt) => stmt,
        Err(e) => {
            println!("Error preparing statement: {}", e);
            return Err(e);
        }
    };

    let mut rows = match stmt.query([]) {
        Ok(rows) => rows,
        Err(e) => {
            println!("Error querying statement: {}", e);
            return Err(e);
        }
    };

    let model = match db_fetch_model(table) {
        Ok(model) => model,
        Err(e) => {
            println!("Error fetching model: {}", e);
            return Err(e);
        }
    };

    let columns: Vec<&str> = model.columns.split(",").collect();    
    let types: Vec<&str> = model.types.split(",").collect();

    let mut data = Vec::new();
    
    while let Some(row) = rows.next().unwrap() {
        let mut row_object = json!({});
        
        for i in 0..columns.len() {
            let column = columns[i];
            let column_type = types[i];
            
            let column_value = match column_type {
                "TEXT" => row.get::<_, String>(column).unwrap(),
                "INTEGER" => row.get::<_, i64>(column).unwrap().to_string(),
                "REAL" => row.get::<_, f64>(column).unwrap().to_string(),
                "BLOB" => row.get::<_, String>(column).unwrap(),
                "NULL" => "NULL".to_string(), 
                "BOOLEAN" => row.get::<_, bool>(column).unwrap().to_string(),
                "DATETIME" => row.get::<_, String>(column).unwrap(), 
                _ => String::new(),
            };

            let key = column.to_string();
            let value = column_value;

            // if key == "password" {
            //     // don't return password
            //     continue;
            // }

            row_object[key] = json!(value);
        }

        data.push(row_object);
    }

    Ok(data)
}

fn db_insert(table: &str, values: Vec<&str>) -> Result<usize> {
    // create connection to database
    let conn = match Connection::open("db/db.sqlite") {
        Ok(conn) => conn,
        Err(e) => {
            println!("Error opening database: {}", e);
            return Err(e);
        }
    };

    // fetch model for table
    let model = match db_fetch_model(table) {
        Ok(model) => model,
        Err(e) => {
            println!("Error fetching model: {}", e);
            return Err(e);
        }
    };

    let mut columns: Vec<&str> = model.columns.split(",").collect();
    // sort columns alphabetically to match sorting fucked by serde__json
    columns.sort();

    let mut query = String::new();
    query.push_str(&format!("INSERT INTO {} (", table));
    
    for i in 0..columns.len() {
        if columns[i] == "id" || columns[i] == "created_at" || columns[i] == "updated_at" {} 
        else {
            if i > 0 {
                query.push_str(", ");
            }
            query.push_str(columns[i]);
        }
    }

    query.push_str(") VALUES ");

    for i in 0..values.len() {
        if i > 0 {
            query.push_str(", ");
        }
        query.push_str(values[i]);
    }

    println!("{}", query);

    let nr_of_created_rows = match conn.execute(
        &query,
        (), // empty list of parameters.
    ) {
        Ok(nr_of_created_rows) => {
            println!("Inserted into table");
            nr_of_created_rows
        },
        Err(e) => {
            println!("Error inserting into table: {}", e);
            return Err(e);
        },
    };

    Ok(nr_of_created_rows)
}

fn db_delete(table: &str, _where: &str) -> Result<()> {
    // create connection to database
    let conn = match Connection::open("db/db.sqlite") {
        Ok(conn) => conn,
        Err(e) => {
            println!("Error opening database: {}", e);
            return Err(e);
        }
    };

    let mut query = String::new();
    query.push_str(&format!("DELETE FROM {} WHERE {}", table, _where));

    match conn.execute(
        &query,
        (), // empty list of parameters.
    ) {
        Ok(_) => {
            println!("Deleted from table");
        },
        Err(e) => {
            println!("Error deleting from table: {}", e);
            return Err(e);
        },
    };

    Ok(())
}

fn db_update(table: &str, values: Vec<&str>, _where: &str) -> Result<usize> {
    // create connection to database
    let conn = match Connection::open("db/db.sqlite") {
        Ok(conn) => conn,
        Err(e) => {
            println!("Error opening database: {}", e);
            return Err(e);
        }
    };

    let mut query = String::new();
    query.push_str(&format!("UPDATE {} SET ", table));
    query.push_str(values[0]);	
    query.push_str(&format!(" WHERE {}", _where));

    let nr_of_updated_rows = match conn.execute(
        &query,
        (), // empty list of parameters.
    ) {
        Ok(nr_of_updated_rows) => {
            println!("Updated table");
            nr_of_updated_rows
        },
        Err(e) => {
            println!("Error updating table: {}", e);
            return Err(e);
        },
    };

    Ok(nr_of_updated_rows)
}

fn db_select_count(table: &str, _where: &str) -> Result<usize> {
    // create connection to database
    let conn = match Connection::open("db/db.sqlite") {
        Ok(conn) => conn,
        Err(e) => {
            println!("Error opening database: {}", e);
            return Err(e);
        }
    };

    let mut query = String::new();
    query.push_str(&format!("SELECT COUNT(*) FROM {} WHERE {}", table, _where));

    let mut stmt = match conn.prepare(&query) {
        Ok(stmt) => stmt,
        Err(e) => {
            println!("Error preparing statement: {}", e);
            return Err(e);
        }
    };

    let mut rows = match stmt.query([]) {
        Ok(rows) => rows,
        Err(e) => {
            println!("Error querying statement: {}", e);
            return Err(e);
        }
    };

    let row = match rows.next() {
        Ok(row) => row,
        Err(e) => {
            println!("Error getting row: {}", e);
            return Err(e);
        }
    };

    let count: i64 = match row.expect("No row returned").get(0) {
        Ok(count) => count,
        Err(e) => {
            println!("Error getting count: {}", e);
            return Err(e);
        }
    };

    Ok(count as usize)
}

fn token_generate(key: &HS256Key, duration: u64) -> Result<String> {
    let claims = Claims::create(Duration::from_hours(duration));
    let token = match key.authenticate(claims) {
        Ok(token) => token,
        Err(e) => {
            println!("Error generating token: {}", e);
            return Err(rusqlite::Error::QueryReturnedNoRows);
        }
    };
    Ok(token)
}

fn token_verify(key: &HS256Key, token: &str) -> Result<JWTClaims<NoCustomClaims>> {
    let claims = match key.verify_token::<NoCustomClaims>(&token, None) {
        Ok(claims) => claims,
        Err(e) => {
            println!("Error verifying token: {}", e);
            return Err(rusqlite::Error::QueryReturnedNoRows);
        }
    };
    Ok(claims)
}

fn password_hash(password: &str) -> Result<String> {
    // Argon2 with default params (Argon2id v19)
    let argon2 = Argon2::default();

    // Hash password to PHC string ($argon2id$v=19$...)
    let password_hash = match argon2.hash_password(password.as_bytes(), &SaltString::generate(&mut OsRng)) {
        Ok(password_hash) => password_hash.to_string(),
        Err(e) => {
            println!("Error hashing password: {}", e);
            return Err(rusqlite::Error::QueryReturnedNoRows);
        }
    };

    Ok(password_hash)
}

fn password_verify(password: &str, password_hash: &str) -> Result<()> {
    // Verify password against PHC string.
    // NOTE: hash params from `parsed_hash` are used instead of what is configured in the `Argon2` instance.
    let parsed_hash = match PasswordHash::new(&password_hash) {
        Ok(parsed_hash) => parsed_hash,
        Err(e) => {
            println!("Error parsing password hash: {}", e);
            return Err(rusqlite::Error::QueryReturnedNoRows);
        }
    };

    match Argon2::default().verify_password(password.as_bytes(), &parsed_hash) {
        Ok(_) => {
            Ok(())
        },
        Err(e) => {
            println!("Error verifying password: {}", e);
            return Err(rusqlite::Error::QueryReturnedNoRows);
        }
    }
}

#[tokio::main]
async fn main() {
    // create a new key for the `HS256` JWT algorithm
    let key = HS256Key::generate();

    // create connection to base database
    let connection = match db_open_connection("db.sqlite") {
        Ok(connection) => connection,
        Err(e) => {
            println!("Error opening database: {}", e);
            return;
        }
    };

    match handle_defaults(&connection) {
        Ok(_) => (),
        Err(e) => {
            println!("Error handling startup: {}", e);
            return;
        }
    }

    // wrap the key in an `Arc` so it can be safely shared across threads
    let state = Arc::new(AppState {
        key: key,
    });

    // start server
    // create a route for receiving a SQL query and executing it on the database and returning the result as JSON

    let cors = CorsLayer::new()
    // allow `GET` and `POST` when accessing the resource
    .allow_methods([Method::GET, Method::POST, Method::PUT, Method::PATCH, Method::DELETE])
    // allow requests from any origin
    .allow_origin(CorsAny)
    // allow headers 'Content-Type' and 'auth_token'
    .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);


    tracing_subscriber::fmt::init();
    let app = Router::new()
        .route("/tinybase/v1/session", get(route_verify_session).post(post_session)).with_state(state.clone())
        
        // CRUD TABLE
        .route("/tinybase/v1/tables/:table", 
            post(route_table_create)
            .patch(route_table_rename) 
            .delete(route_table_drop)
        ).with_state(state.clone())

        // ALTER TABLE COLUMN
        .route("/tinybase/v1/tables/:table/:column", 
            post(route_table_add_column)
            .put(route_table_update_column)
            .patch(route_table_rename_column)
            .delete(route_table_drop_column)
        ).with_state(state.clone())
        
        .route("/tinybase/v1/:table", get(route_table_get_rows)).with_state(state.clone())
            

        .route("/tinybase/v1/:table", post(route_table_create_rows)).with_state(state.clone())
        .route("/tinybase/v1/:table/:id", get(route_table_get_row_by_id).put(route_table_update_row_by_id).delete(route_table_delete_row_by_id)).with_state(state.clone())
        // .route("/", get_service(ServeFile::new("client/dist/index.html"))
            // .handle_error(|error: io::Error| async move {
            //     (
            //         StatusCode::INTERNAL_SERVER_ERROR,
            //         format!("Unhandled internal error: {}", error),
            //     )
            // })
                
        
        .layer(cors);

    // prompt for port
    // println!("Enter port:");
    // let mut port = String::new();

    // match std::io::stdin().read_line(&mut port) {
    //     Ok(_) => (),
    //     Err(e) => {
    //         println!("Error reading port: {}", e);
    //         return;
    //     }
    // }

    // let port = port.trim();
    // let port: u16 = match port.parse() {
    //     Ok(port) => port,
    //     Err(e) => {
    //         println!("Error parsing port: {}", e);
    //         return;
    //     }
    // };
    let port = 3030;

    // start server
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("listening on http://{}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

fn middleware_auth(State(state): State<Arc<AppState>>, headers: header::HeaderMap) -> bool {
    let auth_header = match headers.get(header::AUTHORIZATION) {
        Some(auth_header) => auth_header,
        None => {
            return false;
        }
    };

    let auth_header = auth_header.to_str().unwrap();

    // remove "Bearer " from auth_header
    let token = auth_header.replace("Bearer ", "");
        
    // verify token
    let key = &state.key;
    
    match token_verify(&key, &token) {
        Ok(_) => (),
        Err(e) => {
            println!("Error verifying token: {}", e);
            return false;
        }
    };

    true
}

async fn route_table_get_rows(State(state): State<Arc<AppState>>, headers: header::HeaderMap, Path(table): Path<String>, Query(params): Query<HashMap<String, String>>) -> impl IntoResponse {
    match middleware_auth(State(state.clone()), headers) {
        true => (),
        false => return (StatusCode::UNAUTHORIZED, format!("Unauthorized")),
    };

    // loop through params and create where string
    let mut _where = String::new();
    let mut i = 0;

    for (key, value) in params.iter() {
        if i > 0 {
            _where.push_str(" AND ");
        }
        _where.push_str(&format!("{} = '{}'", key, value));
        i += 1;
    }

    let data = match db_select(&table, &_where) {
        Ok(data) => data,
        Err(e) => {
            println!("Error fetching {}: {}", table, e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };
    
    let response = json!(data);

    (StatusCode::OK, response.to_string())
}


async fn route_table_get_row_by_id(State(state): State<Arc<AppState>>, headers: header::HeaderMap, Path((table, id)): Path<(String, String)>) -> impl IntoResponse {
    match middleware_auth(State(state.clone()), headers) {
        true => (),
        false => return (StatusCode::UNAUTHORIZED, format!("Unauthorized")),
    };

    let _where = format!("id={}", id);

    let data = match db_select(&table, &_where) {
        Ok(data) => data,
        Err(e) => {
            println!("Error fetching {}: {}", table, e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };

    let response = json!(data);

    (StatusCode::OK, response.to_string())
}

async fn route_table_create_rows(State(state): State<Arc<AppState>>, Path(table): Path<String>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    match middleware_auth(State(state.clone()), headers) {
        true => (),
        false => return (StatusCode::UNAUTHORIZED, format!("Unauthorized")),
    };

    // payload = [
        // {
        //     "username": "username",
        //     "password": "password",
        //     "email": "email@email.com",
        //     "role": "role",
        //     "apx": "apx"
        // }
    // ]

    let mut values = String::new();
    let mut i = 0;

    for value in payload.as_array().unwrap() {
        if i > 0 {
            values.push_str(", ");
        }
        values.push_str("(");
        let mut j = 0;
        for (key, value) in value.as_object().unwrap() {
            if j > 0 {
                values.push_str(", ");
            }
            // hash any value with key "password" for now, hash option should be added to interface and datatype should be set to password
            if key == "password" {
                let hashed_value = match password_hash(&value.as_str().unwrap()) {
                    Ok(hashed_value) => hashed_value,
                    Err(e) => {
                        println!("Error hashing password: {}", e);
                        return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
                    }
                };
                values.push_str(&format!("'{}'", hashed_value));
            } else {
                values.push_str(&format!("{}", value));
            }

            j += 1;
        }
        values.push_str(")");
        i += 1;
    }

    let data = match db_insert(&table, vec![&values]) {
        Ok(data) => {
            println!("Inserted into {}", table);
            data
        },
        Err(e) => {
            println!("Error inserting into {}: {}", table, e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };

    let response = json!({
        "created": data,
    });

    (StatusCode::CREATED, response.to_string())
}

async fn route_table_update_row_by_id(State(state): State<Arc<AppState>>, headers: header::HeaderMap, Path((table, id)): Path<(String, String)>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    match middleware_auth(State(state.clone()), headers) {
        true => (),
        false => return (StatusCode::UNAUTHORIZED, format!("Unauthorized")),
    };

    let mut values = String::new();
    let mut i = 0;

    for (key, value) in payload.as_object().unwrap() {
        if i > 0 {
            values.push_str(", ");
        }
        values.push_str(&format!("{} = {}", key, value));
        i += 1;
    }

    let _where = format!("id={}", id);

    let data = match db_update(&table, vec![&values], &_where) {
        Ok(data) => {
            println!("Updated {}", table);
            data
        },
        Err(e) => {
            println!("Error updating {}: {}", table, e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };

    let response = json!({
        "updated": data,
    });

    (StatusCode::OK, response.to_string())
}

async fn route_table_delete_row_by_id(State(state): State<Arc<AppState>>, headers: header::HeaderMap, Path((table, id)): Path<(String, String)>) -> impl IntoResponse {
    match middleware_auth(State(state.clone()), headers) {
        true => (),
        false => return (StatusCode::UNAUTHORIZED, format!("Unauthorized")),
    };

    let _where = format!("id={}", id);

    match db_delete(&table, &_where) {
        Ok(()) => {
            println!("Deleted from {}", table);
        },
        Err(e) => {
            println!("Error deleting from {}: {}", table, e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };

    let response = json!({
        "deleted": id,
    });

    (StatusCode::OK, response.to_string())
}

async fn route_verify_session(State(state): State<Arc<AppState>>, headers: header::HeaderMap) ->  impl IntoResponse {
    match middleware_auth(State(state.clone()), headers) {
        true => (),
        false => return (StatusCode::UNAUTHORIZED, format!("Unauthorized")),
    };

    let response = json!({
        "message": "Authorized"
    });
    (StatusCode::OK, response.to_string())
}

async fn post_session(State(state): State<Arc<AppState>>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    let key = &state.key;

    let username = payload["username"].as_str().unwrap();
    let password = payload["password"].as_str().unwrap();

    let _where = format!("username='{}'", username);

    // fetch user
    let data = match db_select("users", &_where) {
        Ok(data) => data,
        Err(e) => {
            println!("Error fetching users: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };

    if data.len() > 1 {
        println!("More than one user found");
        return (StatusCode::UNAUTHORIZED, format!("More than one user found"));
    } else if data.len() == 0 {
        println!("No user found");
        return (StatusCode::UNAUTHORIZED, format!("No user found"));
    }

    let password_hash = data[0]["password"].as_str().unwrap();

    match password_verify(password, &password_hash) {
        Ok(_) => (),
        Err(e) => {
            println!("Error verifying password: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };

    // generate token
    let DURATION_IN_HOURS = 24;

    let token = match token_generate(&key, DURATION_IN_HOURS) {
        Ok(token) => token,
        Err(e) => {
            println!("Error generating token: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };
    // token string
    
    let token_verified = match token_verify(&key, &token) {
        Ok(token_verified) => token_verified,
        Err(e) => {
            println!("Error verifying token: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };
    // JWTClaims { issued_at: Some(Duration(7279491764493221888)), expires_at: Some(Duration(7279862849667596288)), invalid_before: Some(Duration(7279491764493221888)), issuer: None, subject: None, audiences: None, jwt_id: None, nonce: None, custom: NoCustomClaims }

    let response = json!({
        "token": token,
        "issued_at": token_verified.issued_at.unwrap().as_millis(),
        "expires_at": token_verified.expires_at.unwrap().as_millis(),
    });

    (StatusCode::OK, response.to_string())
}


// CRUD TABLE ROUTES
async fn route_table_create(State(state): State<Arc<AppState>>, headers: header::HeaderMap, Path(table): Path<String>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    match middleware_auth(State(state.clone()), headers) {
        true => (),
        false => return (StatusCode::UNAUTHORIZED, format!("Unauthorized")),
    };

    // payload = {
    //     "description": "New table",
    //     "columns": [
    //         {
    //             "name": "last_name",  
    //             "type": "TEXT",
    //             "options": "NOT NULL"
    //         },
    //     ]
    // }

    // desired structure = {
    //     "name": "new_table",
    //     "description": "New table",
    //     "columns": "name,description",
    //     "types": "TEXT,TEXT",
    //     "options": "UNIQUE,"
    // }

    // transform payload into sql query
    let mut columns = String::new();
    let mut types = String::new();
    let mut options = String::new();

    let mut i = 0;

    for column in payload["columns"].as_array().unwrap() {
        if i > 0 {
            columns.push_str(", ");
            types.push_str(", ");
            options.push_str(", ");
        }
        columns.push_str(&format!("{}", column["name"].as_str().unwrap()));
        types.push_str(&format!("{}", column["type"].as_str().unwrap()));
        options.push_str(&format!("{}", column["options"].as_str().unwrap()));
        i += 1;
    }

    let name = &table;
    let description = payload["description"].as_str().unwrap();

    // create table
    match db_create_table(&name, &description, &columns, &types, &options) {
        Ok(_) => (),
        Err(e) => {
            println!("Error creating table: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };

    let response = json!({
        "created": true,
    });

    (StatusCode::OK, response.to_string())
}

async fn route_table_rename(State(state): State<Arc<AppState>>, headers: header::HeaderMap, Path(table): Path<String>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    match middleware_auth(State(state.clone()), headers) {
        true => (),
        false => return (StatusCode::UNAUTHORIZED, format!("Unauthorized")),
    };

    // payload = {
    //     "name": "new_name",
    //     "description": "New description",
    // }

    // original_name == table
    let new_name = payload["name"].as_str().unwrap();
    let description = payload["description"].as_str().unwrap();

    let name = &table;

    match db_alter_table_rename(&name, &new_name, &description) {
        Ok(_) => (),
        Err(e) => {
            println!("Error altering table: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };

    let response = json!({
        "altered": true,
    });

    (StatusCode::OK, response.to_string())
}

async fn route_table_drop(State(state): State<Arc<AppState>>, headers: header::HeaderMap, Path(table): Path<String>) -> impl IntoResponse {
    match middleware_auth(State(state.clone()), headers) {
        true => (),
        false => return (StatusCode::UNAUTHORIZED, format!("Unauthorized")),
    };

    let name = &table;
 
     match db_alter_table_drop(&name) {
         Ok(_) => (),
         Err(e) => {
             println!("Error dropping table: {}", e);
             return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
         }
     };
 
     let response = json!({
         "altered": true,
     });
 
     (StatusCode::OK, response.to_string())
 }

// ALTER TABLE COLUMN ROUTES
async fn route_table_add_column(State(state): State<Arc<AppState>>, headers: header::HeaderMap, Path((table, column)): Path<(String, String)>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    match middleware_auth(State(state.clone()), headers) {
        true => (),
        false => return (StatusCode::UNAUTHORIZED, format!("Unauthorized")),
    };

    // payload = {
    //     "type": "TEXT",
    //     "options": "NOT NULL"
    // }

    // name == column
    let _type = payload["type"].as_str().unwrap();
    let _options = payload["options"].as_str().unwrap();

    match db_alter_table_add_column(&table, &column, &_type, &_options) {
        Ok(_) => (),
        Err(e) => {
            println!("Error altering table: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };
    
    let response = json!({
        "altered": true,
    });

    (StatusCode::OK, response.to_string())
}

async fn route_table_update_column(State(state): State<Arc<AppState>>, headers: header::HeaderMap, Path((table, column)): Path<(String, String)>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    match middleware_auth(State(state.clone()), headers) {
        true => (),
        false => return (StatusCode::UNAUTHORIZED, format!("Unauthorized")),
    };

    // payload = {
    //     "type": "TEXT",
    //     "options": "NOT NULL"
    // }

    // name == column
    let _type = payload["type"].as_str().unwrap();
    let _options = payload["options"].as_str().unwrap();

    match db_alter_table_update_column(&table, &column, &_type, &_options) {
        Ok(_) => (),
        Err(e) => {
            println!("Error altering table: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };

    let response = json!({
        "altered": true,
    });

    (StatusCode::OK, response.to_string())
}

async fn route_table_rename_column(State(state): State<Arc<AppState>>, headers: header::HeaderMap, Path((table, column)): Path<(String, String)>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    match middleware_auth(State(state.clone()), headers) {
        true => (),
        false => return (StatusCode::UNAUTHORIZED, format!("Unauthorized")),
    };

    // payload = {
    //     "name": "new_name",
    // }

    // original_name == column
    let new_name = payload["name"].as_str().unwrap();

    match db_alter_table_rename_column(&table, &column, &new_name) {
        Ok(_) => (),
        Err(e) => {
            println!("Error altering table: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };

    let response = json!({
        "altered": true,
    });

    (StatusCode::OK, response.to_string())
}

async fn route_table_drop_column(State(state): State<Arc<AppState>>, headers: header::HeaderMap, Path((table, column)): Path<(String, String)>) -> impl IntoResponse {
    match middleware_auth(State(state.clone()), headers) {
        true => (),
        false => return (StatusCode::UNAUTHORIZED, format!("Unauthorized")),
    };

    // original_name == column

    match db_alter_table_drop_column(&table, &column) {
        Ok(_) => (),
        Err(e) => {
            println!("Error altering table: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };

    let response = json!({
        "altered": true,
    });

    (StatusCode::OK, response.to_string())
}