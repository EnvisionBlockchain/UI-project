import React, { Component } from 'react';
import { Loader, Dimmer, Form, Input, Message, Button, Card, Modal, Grid, Icon, Progress } from 'semantic-ui-react';
import web3 from '../ethereum/web3';
import { FactoryInstance } from '../ethereum/factoryInstance';
import { SupplyChainInstance as supplychain_instance } from '../ethereum/contractInstance';
import { stateLabel } from "../utils";

class Factory extends Component {
  state = {
    msg: '',
    errorMessage: '',
    loadingData: false,
    account: '',
    description: '',
    freightCarrierAddress: '',
    originCustomsAddress: '',
    consigneeAddress: '',
    deployedChains: [],
  }

  async componentDidMount() {
    this.setState({ loadingData: true });
    document.title = "Azure UI";

    const accounts = await web3.eth.getAccounts();
    let deployedChains = await FactoryInstance.methods.getDeployedSupplyChain().call({ from: accounts[0] });

    let arr = [];
    for (var i = 0; i < deployedChains.length; i++) {
      const SupplyChainInstance = await supplychain_instance(deployedChains[i]);
      let contractDesc = await SupplyChainInstance.methods.Description().call({ from: accounts[0] });
      let contractState = await SupplyChainInstance.methods.State().call({ from: accounts[0] });
      arr.push([deployedChains[i], contractDesc, contractState]);
    }

    this.setState({ loadingData: false, account: accounts[0], deployedChains: arr });
  }

  renderChains = () => {
    let items = this.state.deployedChains.map((chainDets, id) => {
      return (
        <Card key={id} fluid href={'/UI-project/' + chainDets[0]} style={{ overflowWrap: 'break-word' }}>
          <Card.Content>
            <Card.Header>Address: {chainDets[0]}</Card.Header>
            <Card.Meta>Click For Details</Card.Meta>
            <Card.Description>Description: {chainDets[1]}</Card.Description>
            <Card.Description>Stage: {parseInt(chainDets[2], 10) + 1}/11 (<span style={{ "color": "red" }}>{stateLabel[chainDets[2]]}</span>)</Card.Description><br />
            <Progress value={chainDets[2]} total='10' indicating />
          </Card.Content>
        </Card>
      );
    });

    return <Card.Group>{items}</Card.Group>;
  }

  onSubmit = async (event) => {
    event.preventDefault();
    this.setState({ errorMessage: '', loading: true, msg: '' });

    try {
      let { description, freightCarrierAddress, originCustomsAddress, consigneeAddress, account } = this.state;
      await FactoryInstance.methods.createSupplyChain(description, freightCarrierAddress, originCustomsAddress, consigneeAddress).send({ from: account });
      this.setState({ msg: 'Contract deployed successfully!' });
    } catch (err) {
      this.setState({ errorMessage: err.message });
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
    if (this.state.msg === '') {
      statusMessage = null;
    } else {
      statusMessage = <Message floating positive header="Success!" content={this.state.msg} />;
    }

    return (
      <div>
        <h1>Deployed Supplychain Transportation Contracts</h1>
        <Grid stackable reversed='mobile'>
          <Grid.Column width={12}>
            {this.state.deployedChains.length > 0 && this.renderChains()}
            {this.state.deployedChains.length === 0 && <p>No contracts deployed!</p>}
          </Grid.Column>
          <Grid.Column width={4}>
            <Grid.Row>
              <Modal trigger={<Button primary icon labelPosition='right'><Icon name='plus circle' />Deploy New Supplychain</Button>}>
                <Modal.Header>Supplychain Transportation Factory</Modal.Header>
                <Modal.Content>
                  <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
                    <Form.Field>
                      <label>Description</label>
                      <Input onChange={event => this.setState({ description: event.target.value })} />
                    </Form.Field>
                    <Form.Field>
                      <label>Freight Carrier Address</label>
                      <Input onChange={event => this.setState({ freightCarrierAddress: event.target.value })} />
                    </Form.Field>
                    <Form.Field>
                      <label>Oigin Customs Address</label>
                      <Input onChange={event => this.setState({ originCustomsAddress: event.target.value })} />
                    </Form.Field>
                    <Form.Field>
                      <label>Consignee Address</label>
                      <Input onChange={event => this.setState({ consigneeAddress: event.target.value })} />
                    </Form.Field>
                    <Button loading={this.state.loading} disabled={this.state.loading} primary basic type='submit'>Deploy</Button>
                    <Message error header="Oops!" content={this.state.errorMessage} />
                    {statusMessage}
                  </Form>
                </Modal.Content>
              </Modal>
            </Grid.Row>
          </Grid.Column>
        </Grid>
      </div>
    );
  }
}

export default Factory;