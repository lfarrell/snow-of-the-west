<?php
date_default_timezone_set('America/New_York');

$states = array('az', 'ca', 'co', 'id', 'mt', 'nv', 'nm', 'or', 'ut', 'wa', 'wy');

foreach($states as $s) {
    $state = strtoupper($s);
    $files = scandir('raw_data/' . $state);

    foreach($files as $file) {
        if(!preg_match('/^\./', $file)) {
            $headers = file('raw_data/' . $state . '/' . $file);
            $name_parts = preg_split('/\(/', $headers[0]);
            $name = trim(preg_split('/\#/', $name_parts[0])[1]);

            $provider_parts = preg_split('/-/', $headers[1]);
            $elevation = trim(preg_split('/\s+/', $provider_parts[1])[1]);

            if(preg_match('/SNOTEL/', $provider_parts[0])) {
                $provider = 'SNTL';
            } else {
                $provider = 'SNOW';
            }

            $fh = fopen('data/' . $state . '/' . $file, "wb");
            fputcsv($fh, array('location', 'snow_depth', 'snow_water', 'provider', 'month', 'year', 'elevation'));
            if (($handle = fopen('raw_data/' . $state . '/' . $file, "r")) !== FALSE) {
                while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                    if(preg_match('/^\d{4}/', $data[0]) && $data[0] >= 2000) {
                        $year = $data[0];
                        array_shift($data);
                        $unique_measurements = array_chunk($data, 3);

                        foreach($unique_measurements as $measurement) {
                            if(!preg_match('/^[A-Z]/', $measurement[0])) { continue; }

                            $month = date('m', strtotime(strtolower($measurement[0])));
                            fputcsv($fh, [$name, $measurement[1], $measurement[2], $provider, $month, $year, $elevation]);
                        }
                    }
                }
                fclose($handle);
            }
            fclose($fh);
            echo $file . " processed\n";
        }
    }
}
