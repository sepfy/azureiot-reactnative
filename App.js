import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  FlatList,
} from 'react-native';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import './shim.js'
import crypto from 'crypto'


function Item({ item }) {
  return (
    <View style={styles.listView}>
      <View style={{width: 150}}> 
        <Text style={styles.listText}> {item.key} </Text>
      </View>
      <View>
        <Text style={styles.listText}> {item.value} </Text>
      </View>
    </View>
  );
}

export default class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
         temp: 0,
	 humi: 0,
	 at: 0,
         data:[
           {"key": "Device name", "value": ""},
           {"key": "Last update time", "value": ""},
         ]
    } 

  }

  // See https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-devguide-security
  generateSasToken(resourceUri, signingKey, policyName, expiresInMins) {
    resourceUri = encodeURIComponent(resourceUri);

    // Set expiration in seconds
    var expires = (Date.now() / 1000) + expiresInMins * 60;
    expires = Math.ceil(expires);
    var toSign = resourceUri + '\n' + expires;

    // Use crypto
    var hmac = crypto.createHmac('sha256', Buffer.from(signingKey, 'base64'));
    hmac.update(toSign);
    var base64UriEncoded = encodeURIComponent(hmac.digest('base64'));

    // Construct authorization string
    var token = "SharedAccessSignature sr=" + resourceUri + "&sig="
    + base64UriEncoded + "&se=" + expires;
    if (policyName) token += "&skn="+policyName;
    return token;
  }


  updateIoTData() {

    let signingKey = "<sign key>";
    let resourceUri = "aws-iot-core.azure-devices.net/twins/esp-sensor";
    let policyName = "service";
    let sasToken = this.generateSasToken(resourceUri, signingKey, policyName, 30);
    let url = "https://" + resourceUri + "?api-version=2019-07-01-preview";

    let obj = { 
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": sasToken,
      },
    };

    //console.log(obj);

    fetch(url, obj)
    .then((response) => response.json())
    .then((json) => {
        console.log(json);
	this.setState({temp: parseInt(json.properties.reported.temp),
		       humi: parseInt(json.properties.reported.humi),
		         at: parseInt(json.properties.reported.at),
		       data: [{"key": "Device name", "value": json.deviceId},
		              {"key": "Last update time", 
			"value": json.properties.reported["$metadata"]["$lastUpdated"].substring(0,19)}]
	              });
    })
    .catch((error) => {
      console.error(error);
    });

    setTimeout(() => this.updateIoTData(), 60000);
  }

  componentDidMount() {
    this.updateIoTData();
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.dataView}>
          <Text style={styles.remarkText}>Temperature</Text>
          <Text style={{fontSize:144, fontFamily: 'sans-serif-light', color: "white"}}>{this.state.temp}</Text>
          <View style={styles.IconTextView}>
            <Icon style={styles.iconText} name="opacity" />
            <Text style={styles.iconText}>{this.state.humi}  </Text>
            <Icon style={styles.iconText} name="accessibility" />
            <Text style={styles.iconText}>{this.state.at}</Text>
          </View>
	</View>
	<View style={styles.infoView}>
          <FlatList
            data={this.state.data}
            renderItem={({ item }) => <Item item={item} />}
            keyExtractor={item => item}
          />
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  IconTextView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconText: {
    color: "white",
    fontSize: 32,
  },
  remarkText: {
    color: "#9e9e9e",
    fontSize: 16,
  },
  listText: {
    color: "#9e9e9e",
    fontSize: 12,
  },
  listView: {
    flexDirection: 'row',
  },
  dataView: {
    backgroundColor: "#263238",
    justifyContent: 'center',
    alignItems: 'center',
    flex: 9,
  },
  infoView: {
    backgroundColor: "#263238",
    justifyContent: 'flex-end',
    alignItems: 'center',
    flex: 1,
  },
});

