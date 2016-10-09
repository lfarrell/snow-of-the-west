<?php
//include 'functions.php';
date_default_timezone_set('America/New_York');

$states = array('az', 'ca', 'co', 'id', 'mt', 'nv', 'nm', 'or', 'ut', 'wa', 'wy');

$url_base = "http://www.wcc.nrcs.usda.gov/nwcc/rgrpt?station=";

foreach($states as $state) {
    $state = strtoupper($state);
    if (($handle = fopen("stations/". $state .".csv", "r")) !== FALSE) {
        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            if(preg_match('/Site_Name/', $data[0])) { continue; }

            $ch = curl_init($url_base . $data[1] . '&report=snowmonth_hist');
            $name = strtolower(preg_replace('/(\(|\)|#|\s|\')/', '_', trim($data[0]) . '-' . $data[2]));
           // echo "raw_data/".$state."_snow/" . $name . ".csv"; exit;
            $fp = fopen("raw_data/".$state."/" . $name . ".csv", "wb");

            curl_setopt($ch, CURLOPT_FILE, $fp);
            curl_setopt($ch, CURLOPT_HEADER, 0);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);

            curl_exec($ch);
            curl_close($ch);
            fclose($fp);

            echo $name . " downloaded\n";
        }
    }
    fclose($handle);
}