<?php
$months = range(1,6);

// All states temp & precip
$state_list = array(
    'AZ' => 2,
    'CA' => 4,
    'CO' => 5,
    'ID' => 10,
    'MT' => 24,
    'NV' => 26,
    'NM' => 29,
    'OR' => 35,
    'UT' => 42,
    'WA' => 45,
    'WY' => 48
);
/*
foreach($state_list as $state => $code) {
    foreach($months as $month) {
        if($month < 10) { $month = "0" . $month; }

        $links = [
            'temp' =>  "http://www.ncdc.noaa.gov/cag/time-series/us/$code/00/tavg/1/$month/1895-2016.csv?base_prd=true&firstbaseyear=1901&lastbaseyear=2000",
            'precip' => "http://www.ncdc.noaa.gov/cag/time-series/us/$code/00/pcp/1/$month/1895-2016.csv?base_prd=true&firstbaseyear=1901&lastbaseyear=2000",
            'drought' => "http://www.ncdc.noaa.gov/cag/time-series/us/$code/00/pdsi/1/$month/1895-2016.csv?base_prd=true&firstbaseyear=1901&lastbaseyear=2000",
            "max" => "http://www.ncdc.noaa.gov/cag/time-series/us/$code/00/tmax/1/$month/1895-2016.csv?base_prd=true&firstbaseyear=1901&lastbaseyear=2000"
        ];

        foreach($links as $type => $link) {
            $ch = curl_init($link);
            $fp = fopen("state_data/$type/$state" . '_' . "$month.csv", "wb");

            curl_setopt($ch, CURLOPT_FILE, $fp);
            curl_setopt($ch, CURLOPT_HEADER, 0);

            curl_exec($ch);
            curl_close($ch);
            fclose($fp);
        }

        echo $month . " processed\n";
    }
    echo $state . " processed\n";
} */

$fields = ['temp', 'precip', 'drought', 'max'];

$fh = fopen('all_temps.csv', 'wb');
fputcsv($fh, ['date', 'value','anomaly', 'year', 'month', 'state', 'type']);

foreach($fields as $field) {
    $path = 'state_data/' . $field;
    $files = scandir($path);

    foreach($files as $file) {
        if(is_dir($file)) continue;

        $parts = preg_split('/_/', $file);
        $state = $parts[0];
        echo $path . '/'. $file . "\n";

        if (($handle = fopen($path . "/" . $file, "r")) !== FALSE) {
            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                if(preg_match('/^20/', $data[0])) {
                    $data[4] = substr($data[0], 0, 4);
                    $data[5] = substr($data[0], 4, 2);
                    $data[6] = $state;
                    $data[7] = $field;

                    fputcsv($fh, $data);
                }
            }
            fclose($handle);
        }
    }
}

fclose($fh);