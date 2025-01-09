import type { CellContext, Column, Row, RowData } from '@tanstack/table-core';
import type { ComponentProps } from 'svelte';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import LinkCell from './LinkCell.svelte';
import SortableHeader from './SortableHeader.svelte';

export interface SortableHeaderOpts {
  label: string;
  column: any;
}

export function sortableHeader(opts: ComponentProps<typeof SortableHeader>) {
  return ({ column }: { column: Column<any> }) =>
    renderComponent(SortableHeader, {
      ...opts,
      onclick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
    });
}

export interface LinkCellOpts<T> {
  href: string | ((row: T) => string);
  label?: string | ((row: T) => string);
}

export function linkCell<TData extends RowData>(opts: LinkCellOpts<TData>) {
  return ({ row, getValue, renderValue }: CellContext<TData, string>) => {
    let label: string;
    if (typeof opts.label === 'function') {
      label = opts.label(row.original);
    } else if (typeof opts.label === 'string') {
      label = (row.original as any)[opts.label] as string;
    } else {
      label = renderValue() ?? '';
    }

    return renderComponent(LinkCell, {
      href:
        typeof opts.href === 'function'
          ? opts.href(row.original)
          : (row.original as any)[opts.href],
      label,
    });
  };
}
