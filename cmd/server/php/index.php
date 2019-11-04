<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$conn = null;
$API_KEYS = array("Key123hbeffb9qqq", "BBBBAX43gMCA8u");

function db_connect() {

    $host = "localhost";
    $db_name = "sundhara_wp673";
    $username = "sundhara_wp673";
    $password = "5A6!i5SKp!";

    try{
        $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
        //$conn->exec("set names utf8");
        return $conn;    
    } catch(PDOException $exception){
        return null;   // $exception->getMessage();
    }
}

function Process() {
    

    $conn = db_connect();

    if (!$conn) {
        echo "{}";
        return;
    } else {
        echo '{"ok":true}';
    }
}

Process();
?>

