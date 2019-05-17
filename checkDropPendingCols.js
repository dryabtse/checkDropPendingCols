checkDropPendingCols = function ( database = db.getName(),  showNames = false) { 
    
    var checkIfSecondary = function() {
        var res = db.isMaster();
        assert(res.hasOwnProperty("secondary"));
        return res.secondary;
    };
    
    var checkPV = function() {
        var res = rs.conf();
        if(res.hasOwnProperty("protocolVersion")) {
            if(res.protocolVersion == 1)
                return false;
        };
        return true;
    };
    
    assert.eq((typeof database), "string", "The \'database\' parameter hasn't been specified!"); 

    rs.slaveOk();

    var res = db.getSiblingDB(database).runCommand({
        listCollections: 1,
        filter: {},
        nameOnly: true,
        authorizedCollections: false,
        includePendingDrops: true
    });
    
    if (!res.ok) {
        throw _getErrorWithCode(res, "listCollections failed: " + tojson(res));
    };
    
    var counter = 0;
    var cur = new DBCommandCursor(db.getSiblingDB(database), res);
    cur.forEach(function(c) {
        assert(c.hasOwnProperty("name"));
        if (c.name.match(/^system.drop/)) {
            counter++
            if (showNames) 
                printjson(c.name);
        };
    }); 
    var ret = "Found " + counter + " drop-pending collections."; 
       
    if (counter > 0 && checkIfSecondary() == true && checkPV() == true) {
        ret = ret + " You may be experiencing SERVER-39089.";
    } else if (counter > 0) {
        ret = ret + " Not a secondary or using PV1";
    };
    return ret;
};
