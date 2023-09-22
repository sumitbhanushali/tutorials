use std::{
    env,
    io::{BufRead, BufReader, ErrorKind, Write},
    net::{TcpListener, TcpStream},
    thread,
    time::Duration,
};

fn connect_to_server(port: u32) -> TcpStream {
    let addr = format!("127.0.0.1:{}", port);

    loop {
        match TcpStream::connect(&addr) {
            Ok(socket) => {
                println!("Connection Established with {}", &addr);
                return socket;
            }
            Err(e) => match e.kind() {
                ErrorKind::ConnectionRefused => {
                    thread::sleep(Duration::from_secs(5));
                    eprintln!("retrying!! {}", port);
                    continue;
                }
                other_error => panic!("{}", other_error),
            },
        };
    }
}

fn connect_to_participants(p_ports: &[String]) -> Vec<TcpStream> {
    let mut p_servers: Vec<TcpStream> = Vec::new();

    for p_port in p_ports {
        println!("connecting to participant port {}", p_port);
        let p_port: u32 = p_port.trim().parse().unwrap();
        p_servers.push(connect_to_server(p_port));
    }

    p_servers
}

fn send_message_to_participants(p_conns: Vec<TcpStream>, msg: String) {
    for mut p_conn in p_conns {
        let msg = msg.clone();
        thread::spawn(move || {
            p_conn.write_all(msg.as_bytes()).unwrap();
        });
    }
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let is_coordinator = &args[1];
    let listen_port = &args[2];

    let listen_port: u32 = listen_port.trim().parse().unwrap();
    let listen_addr = format!("127.0.0.1:{}", listen_port);
    let listener = TcpListener::bind(&listen_addr).unwrap();
    println!("Listening on port {}", &listen_addr);

    let p_conns = connect_to_participants(&args[3..]);

    if is_coordinator == "0" {
        println!("0");
    } else {
        //phase 1 start
        send_message_to_participants(p_conns, "COMMIT_ACK".to_string());
        println!("1");
    }

    for stream in listener.incoming() {
        let mut stream = stream.unwrap();

        //phase 1.1
        //if 0 and received commit_ack, send commit or abort

        //phase 1 end
        //if 1 and received commit from all servers

        //phase 2
        //then mark commit and send commit to p servers else send abort

        //failure cases

        let buf_reader = BufReader::new(&stream);
        let request_line = buf_reader.lines().next().unwrap().unwrap();
        let content = "COMMIT";

        println!("{} received: {}", listen_port, request_line);

        let response = format!(
            "{}\r\nContent-Length: {}\r\n\r\n{}",
            "HTTP/1.1 200 OK",
            content.len(),
            content
        );

        stream.write_all(response.as_bytes()).unwrap();
    }
}
