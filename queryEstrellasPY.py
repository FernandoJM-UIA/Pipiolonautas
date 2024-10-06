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
	"FORMAT":  "votable_plain", \
	"PHASE":  "RUN", \
	"JOBNAME":  "Any name (optional)", \
	"JOBDESCRIPTION":  "Any description (optional)", \
	"QUERY":   "SELECT TOP 100 gaia_source.solution_id, gaia_source.designation, gaia_source.source_id, gaia_source.ra, gaia_source.dec, gaia_source.parallax, (1000 / gaia_source.parallax) * TAN(DISTANCE(POINT(gaia_source.ra, gaia_source.dec), POINT(289.217, 47.8841)) ) AS distance_in_parsecs FROM gaiadr3.gaia_source WHERE CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', 0, 0, 0.01)) = 1 AND gaia_source.parallax IS NOT NULL ORDER BY distance_in_parsecs ASC"
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