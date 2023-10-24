# TinyBase
## Small Base, Big Results
Welcome to Tinybase, your compact yet powerful open-source alternative to Supabase. Tinybase is all about simplicity, efficiency, and local control, packing all the features you need while keeping everything streamlined. Our project embodies the philosophy that less is more, delivering a one-file solution for all your backend needs.

## Project Description:
Tinybase takes the complexity out of database management, offering a minimalist yet feature-rich approach. This project consists of two main components: the backend, called "base" and the frontend, known as "tiny". Here's a closer look at what makes Tinybase stand out:

### Backend ("base"):
- Built with Rust and Axum: The heart of Tinybase is built in Rust, a language known for its efficiency and safety. Axum, a modern asynchronous web framework, powers the backend, ensuring robust performance and security.

- SQLite Database: Tinybase relies on a file-based SQLite database, which guarantees data durability and efficient queries. The choice of SQLite keeps your data local, making it an ideal solution for those who prioritize privacy and data ownership.

- Simple Yet Powerful: Tinybase doesn't compromise on features. It offers all the essential functionalities you'd expect in a database system, without the unnecessary bloat. This simplicity makes Tinybase easy to understand, manage, and extend.

- Automated Forms: Tinybase simplifies data insertion with automatic form generation. Even users with no database experience can effortlessly input data, reducing the learning curve and accelerating your project's development.

### Frontend ("tiny"):
- Preact Framework: The frontend is built using Preact, a lightweight alternative to React. This ensures a fast and responsive user interface while keeping your project's footprint small.

- Just-Table Component: Tinybase leverages the Just-Table component, streamlining the presentation of tabular data. This integration ensures your data is presented in an organized and user-friendly manner.

- AUI UX Library: The AUI UX library further enhances the user experience, providing a polished and intuitive interface that your users will love.

Tinybase's strength lies in its simplicity, locality, and ease of deployment. Whether you're a solo developer or a small team, Tinybase simplifies your database management, offering a local alternative to cloud-based services. Experience the power of Tinybase today and unlock the full potential of your projects while keeping them lean and efficient.

## Getting Started User:
### 1. Download the Executable:
To begin your journey with Tinybase, simply download the Tinybase executable for your operating system:

- For Windows: [Download Tinybase for Windows]()
- For macOS: [Download Tinybase for macOS]()
- For Linux: [Download Tinybase for Linux]()  

### 2. Start and Set Superuser Password and Port:
After downloading, it's time to start the server and configure it to your liking. Here's how:

- Run the Tinybase executable, and the server will start.
Once the server is running, you'll be prompted to set a superuser password and port for the Tinybase application. Choose a strong password and specify a port (e.g., 8080). Make sure to note down these details for future use.

### 3. Access Tinybase Locally:

With the server running, open your web browser and enter the following URL in the address bar:

  http://localhost:port
  Replace "port" with the port number you specified during setup (e.g., 8080). You'll be directed to the Tinybase interface.

### 4. You're Done!

Congratulations! You're now ready to use Tinybase. You have successfully set up your local backend server. Start exploring and managing your data effortlessly with the user-friendly Tinybase interface. Whether you're an experienced developer or new to backends, Tinybase simplifies the process, making it accessible to everyone.

Tinybase's user-friendly setup and intuitive interface ensure that you can get started quickly and focus on what matters most – your data and your projects. Enjoy the simplicity and power of Tinybase as you take control of your backend.

## Getting Started Developer:


## Roadmap
### v1
- [x] hash user passwords on creation and on verification (https://github.com/RustCrypto/password-hashes)
- [x] clean up db handlers with uniform response in style with how it should respond with JSON i.e. GET /users --> [users] 
- [x] helper text on inputs
- [x] make checkboxes prettier
- [x] CRUD columns just-table functions
  - [x] inject artificial index from original data and send that back
- [x] CRUD rows just-table functions
- [x] models CRUD in base API
- [x] CRUD columns dialog
- [ ] CRUD rows dialog
  - [ ] disable id, created ... in create/edit mode
- [ ] test CRUD columns from client
- [ ] update function loadTable
- [ ] CRUD tables backend
- [ ] CRUD tables frontent
### v2
- [ ] import from csv, excel
- [ ] import from supabase
- [ ] create seperate keys for admin and normal users and verifiy/issue against them depending on user level
- [ ] verify token middleware
- [ ] restructure axum layout
- [ ] logging to files and with better description
- [ ] tests
