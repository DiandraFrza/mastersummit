@extends('prints.layouts.print_document')

@section('title', 'Hasil Laboratorium - ' . $registration->reg_no . ' - ' . $patient->name)
@section('toolbar_title', 'Hasil Laboratorium: ' . $item->service_name_snapshot)

@section('extra_toolbar_actions')
    <a href="{{ route('prints.single.pdf', ['registration' => $registration->id, 'item' => $item->id]) }}" class="btn-toolbar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download PDF
    </a>
@endsection

@section('content')
<div class="print-sheet">
    <div class="content-relative">
        {{-- Kop Surat Header --}}
        @include('prints.partials.header_letterhead')

        {{-- Document Title --}}
        <div class="doc-title-block">
            <div class="doc-title">HASIL PEMERIKSAAN LABORATORIUM</div>
            <div class="doc-subtitle">{{ $item->service_name_snapshot }} &bull; Sampel: {{ $item->service?->sample?->name ?? 'Darah / Urin' }}</div>
        </div>

        {{-- Patient Demographics --}}
        @include('prints.partials.patient_info_box')

        {{-- Examination Results Table grouped by parameter group_name --}}
        <table class="table-exam">
            <thead>
                <tr>
                    <th style="width: 32%;">PEMERIKSAAN</th>
                    <th style="width: 18%;">HASIL</th>
                    <th style="width: 10%; text-align: center;">FLAG</th>
                    <th style="width: 12%;">SATUAN</th>
                    <th style="width: 18%;">NILAI RUJUKAN</th>
                    <th style="width: 10%;">METODE</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($groupedResults as $groupName => $results)
                    @if (! empty($groupName) && $groupName !== 'General')
                        <tr class="group-header">
                            <td colspan="6">{{ $groupName }}</td>
                        </tr>
                    @endif

                    @foreach ($results as $res)
                        @php
                            $flag = strtolower($res['flag_status'] ?? 'normal');
                            $val = $res['value_numeric'] !== null ? $res['value_numeric'] : ($res['value_text'] ?? '-');
                        @endphp
                        <tr>
                            <td style="font-weight: 500;">{{ $res['parameter_label'] }}</td>
                            <td style="font-weight: 700;" class="tabular-nums">
                                {{ $val }}
                            </td>
                            <td style="text-align: center;">
                                @if ($flag === 'high')
                                    <span class="badge-flag flag-high">HIGH</span>
                                @elseif ($flag === 'low')
                                    <span class="badge-flag flag-low">LOW</span>
                                @elseif ($flag === 'critical')
                                    <span class="badge-flag flag-critical">CRITICAL</span>
                                @elseif ($flag === 'abnormal')
                                    <span class="badge-flag flag-abnormal">ABNORMAL</span>
                                @else
                                    <span class="badge-flag flag-normal">NORMAL</span>
                                @endif
                            </td>
                            <td class="tabular-nums" style="color: #52525b;">{{ $res['unit_snapshot'] ?? '-' }}</td>
                            <td class="tabular-nums" style="color: #52525b;">{{ $res['reference_snapshot'] ?? '-' }}</td>
                            <td style="font-size: 8.5px; color: #71717a;">Automated Analyzer</td>
                        </tr>
                    @endforeach
                @empty
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 20px; color: #71717a;">
                            Belum ada parameter hasil yang tercatat untuk pemeriksaan ini.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        {{-- Group Conclusion / Notes if present --}}
        @if (! empty($item->group_conclusion) || ! empty($item->group_suggestion))
            <div style="border: 1px solid #e4e4e7; border-radius: 4px; padding: 8px 12px; margin-bottom: 12px; background-color: #fafafa; font-size: 9px;">
                @if (! empty($item->group_conclusion))
                    <div style="margin-bottom: 4px;">
                        <strong style="color: #18181b;">Catatan / Kesimpulan Klinis:</strong>
                        <p style="color: #3f3f46; margin-top: 1px;">{{ $item->group_conclusion }}</p>
                    </div>
                @endif
                @if (! empty($item->group_suggestion))
                    <div>
                        <strong style="color: #18181b;">Saran:</strong>
                        <p style="color: #3f3f46; margin-top: 1px;">{{ $item->group_suggestion }}</p>
                    </div>
                @endif
            </div>
        @endif

        {{-- Signatures --}}
        @include('prints.partials.footer_signatures')
    </div>
</div>
@endsection
