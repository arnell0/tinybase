
// MiniBase
// A tiny, simple, and fast one file backend written in Rust.
// Author: @Arnell0

use axum::{
    extract::State,
    routing::{get, post, get_service},
    http::StatusCode,
    response::IntoResponse,
    Json, Router};

use axum::extract::Path;
use axum_extra::extract::Query;
use tower_http::services::ServeFile;

use std::{io};
use std::net::SocketAddr;
use std::collections::HashMap;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use serde_json::{json};

use rusqlite::{Connection, Result};

use jwt_simple::prelude::*;

use std::fs::File;
use std::io::Write;

use argon2::{
    password_hash::{
        rand_core::OsRng,
        PasswordHash, PasswordHasher, PasswordVerifier, SaltString
    },
    Argon2
};

struct AppState {
    key: HS256Key,
    salt: SaltString,
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

#[derive(Serialize, Deserialize)]
struct ResponseData {
    columns: Vec<String>,
    values: Vec<Vec<String>>,
    types: Vec<String>,
}

#[derive(Serialize, Deserialize)]
struct Response {
    model: Model,
    data: ResponseData,
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

fn db_create_table(conn: &Connection, name: &str, description: &str, columns: &str, types: &str, options: &str) -> Result<()> {
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

    match conn.execute(
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

        match conn.execute(
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
    create_file_if_not_exists("log.txt");

    match db_create_table(&connection, "models", "Models table", "name,description,columns,types,options", "TEXT,TEXT,TEXT,TEXT,TEXT", ",,,,") {
        Ok(_) => println!("Created models table"),
        Err(e) => println!("Error creating models table: {}", e),
    }
    
    match db_create_table(&connection, "users", "Users table", "username,password,email,role,apx", "TEXT,TEXT,TEXT,TEXT,TEXT,TEXT", "NOT NULL,NOT NULL,NOT NULL,NOT NULL,NOT NULL,") {
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



fn db_select(table: &str, _where: &str) -> Result<Response> {
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
    let options: Vec<&str> = model.options.split(",").collect();

    let mut data = Vec::new();
    
    while let Some(row) = rows.next().unwrap() {
        let mut value = Vec::new();

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

            value.push(column_value);
        }
        data.push(value);
    }

    // v2
    let mut data_vector = Vec::new();
    
    while let Some(item) = rows.next().unwrap() {
        let mut row = Vec::new();

        for i in 0..columns.len() {
            let column = columns[i];
            let column_type = types[i];

            let cell_value = match column_type {
                "TEXT" => item.get::<_, String>(column).unwrap(),
                "INTEGER" => item.get::<_, i64>(column).unwrap().to_string(),
                "REAL" => item.get::<_, f64>(column).unwrap().to_string(),
                "BLOB" => item.get::<_, String>(column).unwrap(),
                "NULL" => "NULL".to_string(), 
                "BOOLEAN" => item.get::<_, bool>(column).unwrap().to_string(),
                "DATETIME" => item.get::<_, String>(column).unwrap(), 
                _ => String::new(),
            };

            let key = column.to_string();
            let value = cell_value;

            println!("{}: {}", key, value);

            let cell = json!({
                key: value,
            });
            
            row.push(cell);
        }
        data_vector.push(row.clone());
    }
    // end v2

    

    let data = ResponseData {
        columns: columns.iter().map(|s| s.to_string()).collect(),
        types: types.iter().map(|s| s.to_string()).collect(),
        values: data,
    };
    
    let response = Response {
        model: model,
        data: data,
    };

    Ok(response)
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

    let columns: Vec<&str> = model.columns.split(",").collect();

    let mut query = String::new();
    query.push_str(&format!("INSERT INTO {} (", table));

    for i in 3..columns.len() {
        if i > 3 {
            query.push_str(", ");
        }
        query.push_str(columns[i]);
    }

    query.push_str(") VALUES ");

    for i in 0..values.len() {
        if i > 0 {
            query.push_str(", ");
        }
        query.push_str(values[i]);
    }

    // println!("{}", query);

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
            println!("Password verified");
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

    // create a new salt
    let salt = SaltString::generate(&mut OsRng);

    // create connection to base database
    let connection = match Connection::open("db.sqlite") {
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
        salt: salt,
    });

    // start server
    // create a route for receiving a SQL query and executing it on the database and returning the result as JSON
    tracing_subscriber::fmt::init();
    let app = Router::new()
        .route("/tinybase/v1/session", post(post_session)).with_state(state.clone())
        // .route("/tinybase/v1/session", post(post_session)).with_state(state.clone())
        .route("/tinybase/v1/:table", get(get_table).post(post_table))
        .route("/tinybase/v1/:table/:id", get(get_table_by_id).put(put_table_by_id).delete(delete_table_by_id))
        .route("/", get_service(ServeFile::new("client/dist/index.html"))
            .handle_error(|error: io::Error| async move {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Unhandled internal error: {}", error),
                )
            }));

    // prompt for port
    println!("Enter port:");
    let mut port = String::new();

    match std::io::stdin().read_line(&mut port) {
        Ok(_) => (),
        Err(e) => {
            println!("Error reading port: {}", e);
            return;
        }
    }

    let port = port.trim();
    let port: u16 = match port.parse() {
        Ok(port) => port,
        Err(e) => {
            println!("Error parsing port: {}", e);
            return;
        }
    };

    // start server
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("listening on http://{}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn get_table(Path(table): Path<String>, Query(params): Query<HashMap<String, String>>) -> impl IntoResponse {
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
    
    let response = json!({
        "body": data,
        "request": {
            "table": table,
            "where": _where,
        },
    });

    (StatusCode::OK, response.to_string())
}
// test get
// curl http://localhost:3030/tinybase/v1/users

async fn get_table_by_id(Path((table, id)): Path<(String, String)>) -> impl IntoResponse {
    let _where = format!("id={}", id);

    let data = match db_select(&table, &_where) {
        Ok(data) => data,
        Err(e) => {
            println!("Error fetching {}: {}", table, e);
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
        }
    };

    let response = json!({
        "body": data,
        "request": {
            "table": table,
            "id": id,
            "where": _where,
        },
    });

    (StatusCode::OK, response.to_string())
}
// test get/api/users/1
// curl http://localhost:3030/api/users/1

async fn post_table(Path(table): Path<String>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    let request = json!({
        "table": table,
    });

    // payload = [
    //     {
    //         "username": "postman1",
    //         "password": "postman1",
    //         "email": "postman1",
    //         "role": "postman1",
    //         "apx": "postman1"
    //     }
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
            values.push_str(&format!("{}", value));
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
        "body": data,
        "request": request,
    });

    (StatusCode::CREATED, response.to_string())
}
// test post/api/users
// curl -X POST -H "Content-Type: application/json" -d '[{"username": "test", "password": "test"}]' http://localhost:3030/api/users

async fn put_table_by_id(Path((table, id)): Path<(String, String)>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    let request = json!({
        "table": table,
        "id": id,
    });

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
        "body": data,
        "request": request,
    });

    (StatusCode::OK, response.to_string())
}
// test post/api/users/1
// curl -X POST -H "Content-Type: application/json" -d '{"username": "test", "password": "test"}' http://localhost:3030/api/users/1

async fn delete_table_by_id(Path((table, id)): Path<(String, String)>) -> impl IntoResponse {
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
// test delete/api/users/1
// curl -X DELETE http://localhost:3030/api/users/1

async fn post_session(State(state): State<Arc<AppState>>, Json(payload): Json<serde_json::Value>) -> impl IntoResponse {
    let key = &state.key;

    let username = payload["username"].as_str().unwrap();
    let password = payload["password"].as_str().unwrap();

    // let _where = format!("username='{}'", username);

    // let count = match db_select_count("users", &_where) {
    //     Ok(count) => count,
    //     Err(e) => {
    //         println!("Error fetching users: {}", e);
    //         return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
    //     }
    // };

    // if count == 0 {
    //     println!("No user found");
    //     return (StatusCode::UNAUTHORIZED, format!("No user found"));
    // }

    // // fetch user
    // let data = match db_select("users", &_where) {
    //     Ok(data) => data,
    //     Err(e) => {
    //         println!("Error fetching users: {}", e);
    //         return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
    //     }
    // };

    // let password_hash = data.data.values[0][1].clone();
    // println!("password_hash: {:?}", data.data.values[0]);

    // match password_verify(password, &password_hash) {
    //     Ok(_) => (),
    //     Err(e) => {
    //         println!("Error verifying password: {}", e);
    //         return (StatusCode::INTERNAL_SERVER_ERROR, format!("Unhandled internal error: {}", e));
    //     }
    // };

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
// test post/api/session
// curl -X POST -H "Content-Type: application/json" -d '{"username": "superuser", "password": "admin"}' http://localhost:3030/api/session