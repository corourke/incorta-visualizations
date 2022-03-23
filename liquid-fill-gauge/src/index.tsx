import React from 'react';
import {
  useContext,
  LoadingOverlay,
  ErrorOverlay,
  usePrompts,
  useQuery
} from '@incorta-org/component-sdk';
import IframeLiquidFillGauge from './IframeLiquidFillGauge';
import './styles.less';

export default () => {
  const { prompts, drillDown } = usePrompts();
  const { data, context, isLoading, isError, error } = useQuery(useContext(), prompts);
  return (
    <ErrorOverlay isError={isError} error={error}>
      <LoadingOverlay isLoading={isLoading} data={data}>
        {context && data ? (
          <IframeLiquidFillGauge data={data} context={context} prompts={prompts} drillDown={drillDown} />
        ) : null}
      </LoadingOverlay>
    </ErrorOverlay>
  );
};
