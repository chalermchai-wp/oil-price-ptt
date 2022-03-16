/// กำหนดตัวแปรสำหรับจำลอง serve
const express = require('express')
const app = express()
/// กำหนด port ที่ต้องการใช้ในการจำลอง server
const port = 1003
/// กำหนดตัวแปรสำหรับการเรียกใช้ soap api
const soap = require('soap');
/// กำหนดตัวแปรสำหรับใช้แปลง xml เป็น json
const convert = require('xml-js');
/// soap api ptt
// url ของ service ที่ ptt provide ไว้ให้
const url = 'https://orapiweb.pttor.com/oilservice/OilPrice.asmx?WSDL';

const https = require('https');
const axios = require('axios');

// rest api
// https://orapiweb2.pttor.com/api/oilType/listByFrontEnd

/* กำหนด path ที่ใช้เรียกดูข้อมูลราคาน้ำมัน
    app เป็นตัว server
    .get เป็นการระบุ method ในการเรียก api
    '/api/GetListOfOilPriceData' กำหนด path ในการเรียก method
    (req, res)  req คือ request ที่ส่งมา res คือ response ที่ต้องการส่งกลับไปยังผู้เรียก
    getOilPrice(req, res); เป็นการเรียก method ราคาน้ำมันจาก ptt
*/
app.get('/api/GetListOfOilPriceData', (req, res) => {
    getOilPrice(req, res);
})

app.get('/api/getCurrentOilPrice', (req, res) => {
    getCurrentOilPrice(req, res);
})

app.get('/api/getCurrentOilPriceRestApi', (req, res) => {
    getCurrentOilPriceRestApi(req, res);
})


/*  กำหนดให้ตัวจำลอง server ทำงานที่ port ที่ต้องการ */ 
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

/* method เรียกราคาน้ำมัน */ 
function getOilPrice(req, res) {
    
    var curDate = new Date();

    // args กำหนด object ของ parameter ที่ใช้ในการส่งไปเรียก service ราคาน้ำมัน
    var args = {
        Language: 'th',
        DD: curDate.getDate(),
        MM: curDate.getMonth() + 1,
        YYYY: curDate.getFullYear()
    };

    // สร้าง soap request ไปยัง url ที่กำหนด
    soap.createClientAsync(url).then((client) => {
        // เรียก method GetOilPrice ที่มีใน soap  
        // โดยส่ง parameter เป็น object ไป
        client.GetOilPrice(args, function(err, result) {
            // รับค่ากลับมาเป็น error, result,
            // result ที่ได้กลับมาเป็น xml ส่ง result ไปแปลงเป็น json
            return res.send(converXmlToJson(result.GetOilPriceResult))
        });
    
    }).then((result) => {
        // console.log(result);
    });
}

/* method เรียกราคาน้ำมันปัจจุบัน */ 
function getCurrentOilPrice(req, res) {
    
    // args กำหนด object ของ parameter ที่ใช้ในการส่งไปเรียก service ราคาน้ำมัน
    var args = {
        Language: 'th',
    };

    // สร้าง soap request ไปยัง url ที่กำหนด
    soap.createClientAsync(url).then((client) => {
        // เรียก method GetOilPrice ที่มีใน soap  
        // โดยส่ง parameter เป็น object ไป
        client.CurrentOilPrice(args, function(err, result) {
            // รับค่ากลับมาเป็น error, result,
            // result ที่ได้กลับมาเป็น xml ส่ง result ไปแปลงเป็น json
            // console.log(result);
            return res.send(converXmlToJson(result.CurrentOilPriceResult));
        });
    
    }).then((result) => {
        // console.log(result);
    });
}

/* method เรียกราคาน้ำมันปัจจุบัน rest api */ 
function getCurrentOilPriceRestApi(req, result) {

    axios
        .get('https://orapiweb2.pttor.com/api/oilType/listByFrontEnd')
        .then(res => {
            console.log(`statusCode: ${res.status}`)
            console.log(res.data)
            return result.send(res.data);
        })
        .catch(error => {
            console.error(error)
        })

}


// method แปลง xml เป็น json
function converXmlToJson (xml){

    // option ที่ใช้ในการแปลง
    var options = {
        compact: true,
        trim: true,
        ignoreDeclaration: true,
        ignoreInstruction: true,
        ignoreAttributes: true,
        ignoreComment: true,
        ignoreCdata: true,
        ignoreDoctype: true,
        textFn: removeJsonTextAttribute
    };
    
    // เรียก method แปลง json 
    var result = convert.xml2json(xml, options);

    return result;
}

/// https://github.com/nashwaan/xml-js/issues/53#issuecomment-389598083
function nativeType(value) {
    var nValue = Number(value);
    if (!isNaN(nValue)) {
        return nValue;
    }
    var bValue = value.toLowerCase();
    if (bValue === 'true') {
        return true;
    } else if (bValue === 'false') {
        return false;
    }
    return value;
}

// เนื่องจากตอนแปลง xml เป็น json มีการ object ที่เป็น type ของข้อมูลติดมา จึงหาวิธีลบออก
var removeJsonTextAttribute = function(value, parentElement) {
    try {
        var keyNo = Object.keys(parentElement._parent).length;
        var keyName = Object.keys(parentElement._parent)[keyNo - 1];
        parentElement._parent[keyName] = nativeType(value);
    } catch (e) {}
}