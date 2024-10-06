#Python 3
import http.client as httplib
import urllib.parse as urllib
import time
from xml.dom.minidom import parseString

host = "gea.esac.esa.int"
port = 443
pathinfo = "/tap-server/tap/async"


#-------------------------------------
#Create job

params = urllib.urlencode({\
	"REQUEST": "doQuery", \
	"LANG":    "ADQL", \
	"FORMAT":  "csv", \
	"PHASE":  "RUN", \
	"JOBNAME":  "Any name (optional)", \
	"JOBDESCRIPTION":  "Any description (optional)", \
	#"QUERY": "SELECT * FROM gaiadr3.gaia_source WHERE ra BETWEEN 286.12 AND 286.14 AND dec BETWEEN -63.88 AND -63.86"
    #"QUERY":   "SELECT TOP 100 * FROM gaiadr3.gaia_source WHERE gaiadr3_source_id = 0, CONTAINS(POINT('ICRS_GEOCENTER', gaiadr3.gaia_source.ra, gaiadr3.gaia_source.dec), CIRCLE('ICRS', 289.217, 47.8841, 0.001)) = 1"
	#"QUERY":   "SELECT TOP 100 gaia_source.solution_id, gaia_source.designation, gaia_source.source_id, gaia_source.ra, gaia_source.dec, gaia_source.parallax, (1000 / gaia_source.parallax) * TAN(DISTANCE(POINT(gaia_source.ra, gaia_source.dec), POINT(289.217, 47.8841)) ) AS distance_in_parsecs FROM gaiadr3.gaia_source WHERE CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', 289.217, 47.8841, 0.01)) = 1 AND gaia_source.parallax IS NOT NULL ORDER BY distance_in_parsecs ASC"
	"QUERY": "SELECT TOP 2000 gaia_source.solution_id, gaia_source.designation, gaia_source.source_id, gaia_source.ra, gaia_source.dec, gaia_source.parallax, (1000 / gaia_source.parallax) * TAN(DISTANCE(POINT(gaia_source.ra, gaia_source.dec), POINT(0, 0)) * PI() / 180) AS distance_in_parsecs FROM gaiadr3.gaia_source WHERE CONTAINS(POINT('ICRS',gaiadr3.gaia_source.ra,gaiadr3.gaia_source.dec),CIRCLE('ICRS',COORD1(EPOCH_PROP_POS(101.287155333,-16.716115861,379.2100,-546.0100,-1223.0700,-5.5000,2000,2016.0)),COORD2(EPOCH_PROP_POS(101.287155333,-16.716115861,379.2100,-546.0100,-1223.0700,-5.5000,2000,2016.0)),0.002777777777777778))=1"
    })

headers = {\
	"Content-type": "application/x-www-form-urlencoded", \
	"Accept":       "text/plain" \
	}

connection = httplib.HTTPSConnection(host, port)
connection.request("POST",pathinfo,params,headers)

#Status
response = connection.getresponse()
print ("Status: " +str(response.status), "Reason: " + str(response.reason))

#Server job location (URL)
location = response.getheader("location")
print ("Location: " + location)

#Jobid
jobid = location[location.rfind('/')+1:]
print ("Job id: " + jobid)

connection.close()

#-------------------------------------
#Check job status, wait until finished

while True:
	connection = httplib.HTTPSConnection(host, port)
	connection.request("GET",pathinfo+"/"+jobid)
	response = connection.getresponse()
	data = response.read()
	#XML response: parse it to obtain the current status
	#(you may use pathinfo/jobid/phase entry point to avoid XML parsing)
	dom = parseString(data)
	phaseElement = dom.getElementsByTagName('uws:phase')[0]
	phaseValueElement = phaseElement.firstChild
	phase = phaseValueElement.toxml()
	print ("Status: " + phase)
	#Check finished
	if phase == 'COMPLETED': break
	#wait and repeat
	time.sleep(0.2)


connection.close()

#-------------------------------------
#Get results
connection = httplib.HTTPSConnection(host, port)
connection.request("GET",pathinfo+"/"+jobid+"/results/result")
response = connection.getresponse()
data = response.read().decode('iso-8859-1')
#print(type(data))
#print(data)
outputFileName = "example_votable_output.vot"
outputFile = open(outputFileName, "w")
outputFile.write(data)
outputFile.close()
connection.close()
print ("Data saved in: " + outputFileName)	