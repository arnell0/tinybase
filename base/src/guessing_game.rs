use std::io;
use std::cmp::Ordering;
use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..=100);
    println!("Secret number: {secret_number}");

    loop {
        println!("Please input your guess:");
        let mut guess = String::new();

        io::stdin()
            .read_line(&mut guess)
            .expect("Failed"); // will chrash program because of unhandler error

        println!("You guessed: {guess}");
        
        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(msg) => {
                println!("Error: {msg}");
                continue;
            }
        };

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => {
                println!("You win!");
                break;
            },
        }
    }
    
}