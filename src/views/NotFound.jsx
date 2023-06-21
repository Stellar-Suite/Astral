import { Dialog } from '../components/Dialog';
import { Wrapper } from '../components/Wrapper';
import React from 'react'

const NotFound = () => {
  return <React.Fragment>
  <Wrapper>
    <Dialog>
        <div className="center-xy">
            <h1 className="text-4xl text-bold">Not Found</h1>
            <p className="text-lg">Something went wrong and you arrived at a page that hasn't been added yet. </p>
        </div>
    </Dialog>
    </Wrapper>
</React.Fragment>
};

export default NotFound;