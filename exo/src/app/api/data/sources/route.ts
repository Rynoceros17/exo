import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get data sources from database or create default ones
    let sources = await db.dataSource.findMany()

    // If no sources exist, create default NASA data sources
    if (sources.length === 0) {
      const defaultSources = [
        {
          name: 'Kepler Mission',
          type: 'kepler',
          description: 'NASA Kepler Space Telescope - Primary mission for exoplanet discovery',
          url: 'https://exoplanetarchive.ipac.caltech.edu',
          apiEndpoint: 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync',
          totalObjects: 2326,
          config: JSON.stringify({
            mission: 'kepler',
            dataProducts: ['light_curves', 'target_pixel_files'],
            timeRange: { start: '2009-03-07', end: '2013-05-11' },
          }),
        },
        {
          name: 'TESS Mission',
          type: 'tess',
          description: 'Transiting Exoplanet Survey Satellite - All-sky survey for exoplanets',
          url: 'https://tess.mit.edu',
          apiEndpoint: 'https://archive.stsci.edu/tess/bulk_downloads.html',
          totalObjects: 6919,
          config: JSON.stringify({
            mission: 'tess',
            dataProducts: ['light_curves', 'full_frame_images'],
            sectors: 'all',
          }),
        },
        {
          name: 'K2 Mission',
          type: 'k2',
          description: 'Kepler K2 Mission - Extended mission using Kepler spacecraft',
          url: 'https://archive.stsci.edu/kepler/k2.html',
          apiEndpoint: 'https://archive.stsci.edu/k2/data_search/search.php',
          totalObjects: 547,
          config: JSON.stringify({
            mission: 'k2',
            campaigns: 'all',
            dataProducts: ['light_curves', 'target_pixel_files'],
          }),
        },
        {
          name: 'Combined Dataset',
          type: 'combined',
          description: 'Combined data from Kepler, TESS, and K2 missions',
          url: 'https://exoplanetarchive.ipac.caltech.edu',
          apiEndpoint: 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync',
          totalObjects: 9792,
          config: JSON.stringify({
            missions: ['kepler', 'tess', 'k2'],
            combined: true,
            crossMission: true,
          }),
        },
      ]

      sources = await db.dataSource.createMany({
        data: defaultSources,
      })

      // Fetch the created sources
      sources = await db.dataSource.findMany()
    }

    return NextResponse.json({
      success: true,
      sources,
    })
  } catch (error) {
    console.error('Error fetching data sources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data sources' },
      { status: 500 }
    )
  }
}