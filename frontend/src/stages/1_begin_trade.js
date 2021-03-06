import React, { Component } from 'react';
import { Loader, Dimmer, Form, Button, Input, Message, Progress } from 'semantic-ui-react';
import SparkMD5 from 'spark-md5';
import { azureUpload } from "../utils";

const { uploadBrowserDataToAzureFile, Aborter } = require("@azure/storage-file");

class SendForExportClearance extends Component {
  state = {
    msg: '',
    errorMessage: '',
    loadingData: false,
    seller: '',
    bank: '',
    pod: '',
    cfDocs: '',
    cDocs: '',
    cfDocsHash: '',
    cDocsHash: '',
    cfDocsProgress: 0,
    cDocsProgress: 0
  }

  async componentDidMount() {
    this.setState({ loadingData: true });
    document.title = "Cargo Shipmemnt | Begin Trade";
    this.setState({ loadingData: false });
  }

  onSubmit = async (event) => {
    event.preventDefault();
    this.setState({ errorMessage: '', loading: true, msg: '' });

    try {
      await this.props.SupplyChainInstance.methods.ExportClearance(this.state.seller, this.state.pod, this.state.bank, this.state.cfDocsHash, this.state.cDocsHash).send({ from: this.props.account });
      await this.uploadFileToAzure(this.state.cfDocs, "cfDocs", this.state.cfDocsHash);
      await this.uploadFileToAzure(this.state.cDocs, "cDocs", this.state.cDocsHash);
      this.setState({ msg: 'Successfully uploaded!', errorMessage: '' });
    } catch (err) {
      this.setState({ errorMessage: err.message, msg: '' });
    }

    this.setState({ loading: false });
  }

  uploadFileToAzure = async (file, docType, fileName) => {
    this.setState({ loading: true });
    const fileURL = await azureUpload(fileName);

    await uploadBrowserDataToAzureFile(Aborter.none, file, fileURL, {
      rangeSize: 4 * 1024 * 1024, // 4MB range size
      parallelism: 20, // 20 concurrency
      progress: ev => {
        let prgs = Math.round(ev.loadedBytes * 10000 / file.size) / 100;
        if (docType === 'cfDocs') {
          this.setState({ cfDocsProgress: prgs });
        } else {
          this.setState({ cDocsProgress: prgs });
        }
      }
    });

    this.setState({ loading: false });
  }

  captureDocs = (file, docType) => {
    this.setState({ errorMessage: '', loading: true, msg: '' });

    if (typeof file !== 'undefined') {
      try {
        let reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = async () => {
          const buffer = Buffer.from(reader.result);
          var spark = new SparkMD5.ArrayBuffer();
          spark.append(buffer);
          let hash = spark.end();
          if (docType === 'cfDocs') {
            this.setState({ cfDocsHash: hash.toString() });
          } else {
            this.setState({ cDocsHash: hash.toString() });
          }
        }
      } catch (err) {
        console.log("error: ", err.message);
      }
    } else {
      this.setState({ errorMessage: 'No file selected!', msg: '' });
    }
    this.setState({ loading: false });
  }

  render() {
    if (this.state.loadingData) {
      return (
        <Dimmer active inverted>
          <Loader size='massive'>Loading...</Loader>
        </Dimmer>
      );
    }

    let statusMessage;
    if (this.state.msg === '' && this.state.errorMessage === '') {
      statusMessage = null;
    } else {
      statusMessage = <Message floating positive header={this.state.msg} />;
    }

    return (
      <div>
        <br /><br />
        <h3>Pending Action: </h3>
        <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
          <Form.Field>
            <label>Seller</label>
            <Input onChange={event => this.setState({ seller: event.target.value })} placeholder="Enter Seller's Name" />
          </Form.Field>
          <Form.Field>
            <label>Port Of Discharge</label>
            <Input onChange={event => this.setState({ pod: event.target.value })} />
          </Form.Field>
          <Form.Field>
            <label>Origin Bank</label>
            <Input onChange={event => this.setState({ bank: event.target.value })} />
          </Form.Field>
          <Form.Field>
            <label>Customs Filing Docs</label>
            <Input type='file' onChange={event => { this.setState({ cfDocs: event.target.files[0] }); this.captureDocs(event.target.files[0], 'cfDocs') }} />
            {this.state.cfDocsHash &&
              <div>
                File Hash: {this.state.cfDocsHash} <br />
                <Progress percent={this.state.cfDocsProgress} indicating progress='percent' />
              </div>
            }
          </Form.Field>
          <Form.Field>
            <label>Customs Docs</label>
            <Input type='file' onChange={event => { this.setState({ cDocs: event.target.files[0] }); this.captureDocs(event.target.files[0], 'cDocs') }} />
            {this.state.cDocsHash &&
              <div>
                File Hash: {this.state.cDocsHash} <br />
                <Progress percent={this.state.cDocsProgress} indicating progress='percent' />
              </div>
            }
          </Form.Field><br />
          <Button loading={this.state.loading} disabled={this.state.loading} color='green' type='submit'>BEGIN</Button>
          <Message error header="Oops!" content={this.state.errorMessage} />
          {statusMessage}
        </Form>
      </div>
    );
  }
}

export default SendForExportClearance;