cargo build --target x86_64-pc-windows-gnu


2023-09-12
Added routes for CRUD:
route("/tinybase/v1/:table", get(get_table).post(post_table))
route("/tinybase/v1/:table/:id", get(get_table_by_id).put(put_table_by_id).delete(post_table_by_id))
Based on some reccomendations online










2023-08-25
I am building tinybase, a tiny alternative to firebase/supabase that will be focused on ease of use and simplicity. The goal is a complete backend with a single executable.
My first instinct was to build this with node since that is my goto language, but that would be to messy and not really what I am looking for. We want speed, simplicty and localality.
So inspired by pockebase (written in Go) I decided on Rust, this will be my first project with Rust so bear with my while I learn. So starting, the first thing we need is a simple web server capable of serving html files, for the client, and some basic api endpoints. The very crude roadmap looks like this: simple client --> database --> auth --> CRUD database from client
and that is it for now. Starting with a simple rust program that serves som static files, I found this [https://carlosmv.hashnode.dev/getting-started-with-axum-rust](guide) helpful. So this is what we are starting with in main.rs
